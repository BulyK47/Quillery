// Generates Chrome Web Store screenshots by driving the real app with Playwright,
// then composing branded 1280x800 images. Needs the dev server running:
//   npm run dev   (in another terminal), then: node scripts/screenshots.mjs
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "store-assets", "screenshots");
mkdirSync(outDir, { recursive: true });

const APP_URL = process.env.APP_URL || "http://localhost:5173";
const NOW = 1735000000000;

const demo = {
  categories: [
    { id: "writing", name: "Writing", emoji: "🟦", color: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400", isDefault: true },
    { id: "coding", name: "Coding", emoji: "🟩", color: "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400", isDefault: true },
    { id: "marketing", name: "Marketing", emoji: "🟨", color: "bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400", isDefault: true },
    { id: "experimental", name: "Experimental", emoji: "🟥", color: "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400", isDefault: true },
  ],
  prompts: [
    { id: "d1", title: "Summarize & extract action items", content: "Summarize the text below in 3–5 clear bullet points, then list any action items or decisions.\n\n{{text}}", category: "writing", tags: ["summary", "work"], isPinned: true, usageCount: 42, rating: 5, targetModel: "chatgpt", createdAt: NOW - 1000, updatedAt: NOW - 1000 },
    { id: "d2", title: "Explain this code", content: "Explain what the following code does, step by step, then point out any bugs or improvements.\n\n{{code}}", category: "coding", tags: ["dev"], isPinned: true, usageCount: 31, targetModel: "claude", createdAt: NOW - 2000, updatedAt: NOW - 2000 },
    { id: "d3", title: "Catchy social post", content: "Write a short, engaging social media post about {{topic}}. Friendly tone, one or two emojis, and 3 relevant hashtags.", category: "marketing", tags: ["social"], isPinned: false, usageCount: 23, targetModel: "gemini", createdAt: NOW - 3000, updatedAt: NOW - 3000 },
    { id: "d4", title: "Polish my writing", content: "Rewrite the text below to be clearer, more concise and professional, keeping my meaning.\n\n{{text}}", category: "writing", isPinned: false, usageCount: 18, rating: 4, targetModel: "chatgpt", createdAt: NOW - 4000, updatedAt: NOW - 4000 },
    { id: "d5", title: "Cold outreach email", content: "Write a friendly cold outreach email to {{name}} at {{company}} about {{product}}. Under 120 words with a clear call to action.", category: "marketing", tags: ["sales", "email"], isPinned: false, usageCount: 12, targetModel: "claude", createdAt: NOW - 5000, updatedAt: NOW - 5000 },
    { id: "d6", title: "Brainstorm ideas", content: "Give me 10 creative ideas for {{problem}}. For each: a one-line description and why it could work.", category: "experimental", tags: ["ideas"], isPinned: false, usageCount: 7, createdAt: NOW - 6000, updatedAt: NOW - 6000 },
  ],
};

const captions = {
  "app-1-list.png": { title: "All your prompts, organized", sub: "Categories, tags, ⭐ ratings and instant fuzzy search — in a side panel that stays open." },
  "app-2-variables.png": { title: "Reusable, with variables", sub: "Fill {{placeholders}} with a live preview, then copy the personalized result." },
  "app-3-optimize.png": { title: "Optimize for any model", sub: "Tailor a prompt for ChatGPT, Claude or Gemini — entirely on your device." },
  "app-4-stats.png": { title: "Know what you use", sub: "Totals, estimated tokens, a category breakdown and your most-used prompts." },
};

function frameHtml(b64, title, sub) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    * { margin: 0; box-sizing: border-box; font-family: -apple-system, "Segoe UI", Roboto, sans-serif; }
    body { width: 1280px; height: 800px; overflow: hidden;
      background: radial-gradient(130% 130% at 78% 8%, #4f46e5 0%, #312e81 52%, #4c1d95 100%); }
    .wrap { display: flex; height: 100%; align-items: center; }
    .left { flex: 1; padding: 0 64px 0 88px; color: #fff; }
    .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; opacity: .95; }
    .brand .q { width: 40px; height: 40px; border-radius: 11px; background: rgba(255,255,255,.16);
      display: flex; align-items: center; justify-content: center; font-size: 22px; }
    .brand span { font-size: 22px; font-weight: 700; letter-spacing: .2px; }
    h1 { font-size: 50px; line-height: 1.08; font-weight: 800; margin-bottom: 20px; letter-spacing: -1px; }
    p { font-size: 22px; line-height: 1.5; color: rgba(255,255,255,.9); max-width: 460px; }
    .right { width: 470px; display: flex; align-items: center; justify-content: center; padding-right: 56px; }
    .shot { height: 700px; border-radius: 22px; box-shadow: 0 30px 70px rgba(20,10,60,.45);
      border: 1px solid rgba(255,255,255,.12); }
  </style></head><body><div class="wrap">
    <div class="left">
      <div class="brand"><div class="q">🪶</div><span>Quillery</span></div>
      <h1>${title}</h1><p>${sub}</p>
    </div>
    <div class="right"><img class="shot" src="data:image/png;base64,${b64}" /></div>
  </div></body></html>`;
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 440, height: 880 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.goto(APP_URL);
  await page.evaluate((d) => {
    localStorage.setItem("prompts", JSON.stringify(d.prompts));
    localStorage.setItem("categories", JSON.stringify(d.categories));
    localStorage.setItem("theme", "dark");
  }, demo);
  await page.reload();
  await page.waitForSelector("h1");
  await page.waitForTimeout(600);

  const shot = (name) => page.screenshot({ path: join(outDir, name) });

  // 1) prompt list
  await shot("app-1-list.png");

  // 2) variables dialog (first card has {{text}})
  await page.getByRole("button", { name: "Copy", exact: true }).first().click();
  await page.getByText("Fill Variables").waitFor();
  await page.locator("#text").fill("the Q3 board meeting notes");
  await page.waitForTimeout(300);
  await shot("app-2-variables.png");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  // 3) optimize dialog with a result
  await page.getByRole("button", { name: "More actions" }).first().click();
  await page.getByRole("menuitem", { name: /Optimize with AI/ }).click();
  await page.getByText("Multi-Model AI Optimizer").waitFor();
  await page.getByRole("button", { name: /Optimize for/ }).click();
  await page.getByRole("button", { name: "Apply", exact: true }).waitFor();
  await page.waitForTimeout(400);
  await shot("app-3-optimize.png");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  // 4) stats
  await page.getByRole("tab", { name: /Stats/ }).click();
  await page.getByText("Statistics").waitFor();
  await page.waitForTimeout(400);
  await shot("app-4-stats.png");

  // compose branded 1280x800 store images
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const page2 = await ctx2.newPage();
  let i = 1;
  for (const [file, cap] of Object.entries(captions)) {
    const b64 = readFileSync(join(outDir, file)).toString("base64");
    await page2.setContent(frameHtml(b64, cap.title, cap.sub));
    await page2.waitForTimeout(250);
    await page2.screenshot({ path: join(outDir, `store-${i}.png`) });
    i++;
  }

  await browser.close();
  console.log(`Saved ${i - 1} store screenshots + app shots to store-assets/screenshots/`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
