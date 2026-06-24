// Variable helpers for {{name}} placeholders inside prompt content.

const VARIABLE_RE = /\{\{([^}]+)\}\}/g;

/** Returns the unique list of variable names found in the content. */
export function extractVariables(content: string): string[] {
  const found: string[] = [];
  let match: RegExpExecArray | null;
  VARIABLE_RE.lastIndex = 0;
  while ((match = VARIABLE_RE.exec(content)) !== null) {
    const name = match[1].trim();
    if (!found.includes(name)) found.push(name);
  }
  return found;
}

/** True if the content contains at least one {{variable}}. */
export function hasVariables(content: string): boolean {
  return /\{\{[^}]+\}\}/.test(content);
}

/** Replaces every {{name}} with its value from the map. */
export function replaceVariables(
  content: string,
  values: Record<string, string>,
): string {
  let result = content;
  for (const [name, value] of Object.entries(values)) {
    const re = new RegExp(`\\{\\{\\s*${escapeRegExp(name)}\\s*\\}\\}`, "g");
    // Function replacer inserts the value verbatim — otherwise a value
    // containing $&, $1, $$ etc. would be interpreted as a replacement pattern.
    result = result.replace(re, () => value);
  }
  return result;
}

export function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
