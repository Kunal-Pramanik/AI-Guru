// Quick health check for your Gemini key:  npm run check-ai
// Lists the Gemini models your key can use and tries one tiny request.
import { readFileSync } from "node:fs";
import { GoogleGenAI } from "@google/genai";

try {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  console.error("❌ .env.local not found. Copy .env.example to .env.local and add GEMINI_API_KEY.");
  process.exit(1);
}
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is empty in .env.local");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const names = [];
for await (const m of await ai.models.list()) names.push(m.name.replace("models/", ""));
const flash = names.filter((n) => /flash/.test(n));
console.log("✅ Key works. Flash models available to you:\n  " + flash.join("\n  "));

async function tryChain(label, models) {
  for (const model of models.filter(Boolean)) {
    try {
      const r = await ai.models.generateContent({ model, contents: "Say hello to a child in one short sentence." });
      console.log(`✅ ${label}: ${model} works → ${r.text?.trim()}`);
      return true;
    } catch (e) {
      const msg = String(e.message);
      const why = /503|high demand/i.test(msg) ? "busy right now (503, temporary)" : /429/.test(msg) ? "quota limit (429)" : /404|no longer available|not found/i.test(msg) ? "not available for this key" : msg.slice(0, 100);
      console.log(`   ⚠️  ${model}: ${why}`);
    }
  }
  console.log(`❌ ${label}: no model answered just now. If they were all busy (503), wait a few minutes and run again.`);
  return false;
}

console.log("\nLesson models (Flash):");
await tryChain("Lessons", [process.env.GEMINI_MODEL, "gemini-3.5-flash", "gemini-3.6-flash", "gemini-3.7-flash", "gemini-3.8-flash"]);
console.log("\nBackup + picture models (Flash-Lite):");
await tryChain("Pictures/backup", ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-2.5-flash-lite"]);
