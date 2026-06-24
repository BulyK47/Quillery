import type {
  OptimizationChange,
  OptimizationResult,
  TargetModel,
} from "@/types";

// Rule-based, fully local prompt optimizer. No network / API calls — it applies
// model-specific best practices to the text and explains every change. Each
// model has an ordered set of rules; a rule fires only when its `when` test
// passes, so an already-strong prompt is changed little or not at all.

interface Ctx {
  /** Current (possibly already-transformed) text. */
  content: string;
  lower: string;
  /** The user's original text length, for stable length-based decisions. */
  originalLength: number;
}

interface Rule {
  id: string;
  when: (c: Ctx) => boolean;
  /** Transform the text. Omit for advisory-only rules (explanation, no change). */
  apply?: (content: string) => string;
  change?: OptimizationChange;
  explanation: string;
}

const has = (lower: string, ...needles: string[]) =>
  needles.some((n) => lower.includes(n));

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

// An actual XML/HTML tag, not just a stray "<" or ">" (e.g. "latency < 200ms").
const HAS_TAG = /<\/?[a-zA-Z][\w-]*\s*\/?>/;
// Vague wording worth flagging (word-boundary, so "good 12-week plan" is fine).
const VAGUE = /(\bsomething\b|\bstuff\b|\bthings?\b|\ba lot\b|\bsome kind\b|\bsomehow\b|\bwhatever\b|\bmake it better\b|\betc\b)/i;
// Real exclusion/constraint phrasing (not the bare word "not").
const HAS_CONSTRAINTS = /\b(avoid|exclude|must not|do not include|don'?t include|without|except)\b/i;
// Analytical intent (word-boundary so "explanation" doesn't match "plan").
const ANALYTICAL = /\b(analy[sz]e|analysis|compare|comparison|evaluate|assess|strategy|strategi[sz]e|plan|design|decide|optimi[sz]e)\b/i;
const MENTIONS_STEPS = /\bsteps?\b|step-by-step/i;

// Advisory rules shared by every model (explanation-only, no transform).
const UNIVERSAL_ADVISORIES: Rule[] = [
  {
    id: "specificity",
    when: ({ content }) => VAGUE.test(content),
    explanation:
      "Replace vague wording (e.g. “something”, “things”, “etc.”) with concrete specifics — exact topics, numbers, names and formats — for sharper, more reliable output.",
  },
  {
    id: "too-thin",
    when: ({ content }) => words(content) < 8,
    explanation:
      "This prompt is quite short. Add context — who it's for, the goal, and any hard constraints — so the model doesn't have to guess.",
  },
];

const CHATGPT_RULES: Rule[] = [
  {
    id: "role",
    when: ({ lower }) => !has(lower, "you are", "act as", "you're a"),
    apply: (c) => `You are an expert assistant. ${c}`,
    change: { type: "added", description: 'Role definition ("You are…")' },
    explanation:
      'ChatGPT responds better when the role is clearly defined with "You are…" at the beginning.',
  },
  {
    id: "format",
    when: ({ lower }) =>
      !has(lower, "format", "structur", "bullet", "list", "table", "markdown"),
    apply: (c) =>
      c +
      `\n\nProvide your response in a clear, structured format with headings and bullet points where appropriate.`,
    change: { type: "added", description: "Formatting requirement" },
    explanation:
      "ChatGPT benefits from explicit instructions about response structure.",
  },
  {
    id: "tone",
    when: ({ lower }) =>
      !has(lower, "tone", "style", "voice", "formal", "casual"),
    apply: (c) => c + `\n\nUse a conversational yet professional tone.`,
    change: { type: "added", description: "Tone specification" },
    explanation:
      "Defining tone helps ChatGPT stay consistent across the response.",
  },
  {
    id: "reasoning",
    when: ({ content }) => ANALYTICAL.test(content) && !MENTIONS_STEPS.test(content),
    apply: (c) =>
      c + `\n\nWork through the problem step by step before giving your final answer.`,
    change: { type: "added", description: "Step-by-step reasoning" },
    explanation:
      "For analytical tasks, asking ChatGPT to reason step by step improves accuracy.",
  },
];

const CLAUDE_RULES: Rule[] = [
  {
    id: "xml",
    when: ({ content }) => !HAS_TAG.test(content),
    apply: (c) => `<task>\n${c}\n</task>`,
    change: { type: "added", description: "XML tags for structure" },
    explanation:
      "Claude processes prompts more reliably when structured with XML tags (<task>, <context>, <example>).",
  },
  {
    id: "context",
    when: ({ lower }) => !has(lower, "<context", "context:", "background"),
    apply: (c) =>
      c +
      `\n\n<context>\n[Add relevant background: audience, purpose and any constraints]\n</context>`,
    change: { type: "added", description: "Context section" },
    explanation:
      "Claude makes good use of explicit context about audience and purpose — give it the background it needs.",
  },
  {
    id: "example",
    when: ({ lower }) => !has(lower, "example", "exemplu", "e.g."),
    apply: (c) =>
      c +
      `\n\n<example>\n[Include a concrete example of the output you expect]\n</example>`,
    change: { type: "added", description: "Example section" },
    explanation:
      "Claude learns very well from concrete examples — the more specific, the better.",
  },
  {
    id: "thinking",
    when: ({ content }) => !MENTIONS_STEPS.test(content) && !/\bthink\b/i.test(content),
    apply: (c) =>
      c +
      `\n\n<instructions>\nThink through this step-by-step before providing your final answer.\n</instructions>`,
    change: { type: "added", description: "Step-by-step thinking" },
    explanation:
      "Claude excels at complex reasoning when asked to think methodically, step by step.",
  },
];

const GEMINI_RULES: Rule[] = [
  {
    id: "concise",
    when: ({ originalLength }) => originalLength > 600,
    change: { type: "modified", description: "Recommend a more concise prompt" },
    explanation:
      "Gemini prefers direct, concise instructions. This prompt is long — trim it to its essentials rather than adding more.",
  },
  {
    id: "task-prefix",
    when: ({ content, originalLength }) =>
      originalLength <= 600 && !content.trimStart().startsWith("[TASK]"),
    apply: (c) => `[TASK] ${c}`,
    change: { type: "added", description: "[TASK] prefix for clarity" },
    explanation:
      "Gemini processes efficiently when the task is clearly marked at the beginning.",
  },
  {
    id: "format",
    when: ({ lower, originalLength }) =>
      originalLength <= 600 && !has(lower, "json", "format", "table"),
    apply: (c) =>
      c +
      `\n\n[OUTPUT FORMAT]\nProvide the response in a clear format (use tables, lists or JSON when applicable).`,
    change: { type: "added", description: "Output format specification" },
    explanation:
      "Gemini excels at structured content — specify the desired format (JSON, tables, etc.).",
  },
  {
    id: "constraints",
    when: ({ content, originalLength }) =>
      originalLength <= 600 && !HAS_CONSTRAINTS.test(content),
    apply: (c) =>
      c + `\n\n[CONSTRAINTS]\nBe direct and avoid unnecessary elaboration.`,
    change: { type: "added", description: "Explicit constraints" },
    explanation:
      "Gemini respects explicit constraints well — say what to avoid for more precise results.",
  },
];

const RULES: Record<Exclude<TargetModel, "universal">, Rule[]> = {
  chatgpt: CHATGPT_RULES,
  claude: CLAUDE_RULES,
  gemini: GEMINI_RULES,
};

export function optimizePrompt(
  content: string,
  model: TargetModel,
): OptimizationResult {
  const originalLength = content.length;
  const rules = RULES[model as Exclude<TargetModel, "universal">];

  let result = content;
  const changes: OptimizationChange[] = [];
  const explanation: string[] = [];

  // Advisory-only universal checks first (no transform, just guidance).
  for (const rule of UNIVERSAL_ADVISORIES) {
    if (rule.when({ content: result, lower: result.toLowerCase(), originalLength })) {
      explanation.push(rule.explanation);
    }
  }

  if (!rules) {
    // "universal" / unknown target: we only have general advisories to offer.
    if (changes.length === 0 && explanation.length === 0) {
      explanation.push(
        "Pick a target model (ChatGPT, Claude or Gemini) to apply model-specific optimizations.",
      );
    }
    return { content: result, explanation, changes };
  }

  // Model-specific rules, re-evaluating context after each transform.
  for (const rule of rules) {
    const ctx = { content: result, lower: result.toLowerCase(), originalLength };
    if (!rule.when(ctx)) continue;
    if (rule.apply) result = rule.apply(result);
    if (rule.change) changes.push(rule.change);
    explanation.push(rule.explanation);
  }

  if (changes.length === 0 && explanation.length === 0) {
    explanation.push(
      `This prompt already follows ${model.toUpperCase()} best practices — nothing to change.`,
    );
  }

  return { content: result, explanation, changes };
}

export function modelTips(model: TargetModel): string[] {
  switch (model) {
    case "chatgpt":
      return [
        'Define the role clearly with "You are…" at the beginning',
        "Use lists and bullet points for structure",
        "Specify the desired tone (professional, casual, technical)",
        "Ask for step-by-step reasoning on analytical tasks",
        "Set length or format limits when relevant",
      ];
    case "claude":
      return [
        "Use XML tags for sections (<task>, <context>, <example>)",
        "Include concrete, specific examples",
        "Request step-by-step reasoning for complex tasks",
        "Give detailed context about audience and purpose",
        "Claude excels at deep analysis — don't hesitate to ask for detail",
      ];
    case "gemini":
      return [
        "Be concise and direct in your instructions",
        "Specify the output format (JSON, tables, lists)",
        "Use clear prefixes: [TASK], [CONTEXT], [OUTPUT]",
        "Define explicit constraints (what to avoid)",
        "Gemini handles structured data well — take advantage of it",
      ];
    default:
      return [];
  }
}
