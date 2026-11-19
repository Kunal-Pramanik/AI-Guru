import "server-only";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ApiError } from "@google/genai";
import { FriendlyError, getClient, isDailyQuota, tempFor, toFriendly, withModel } from "./gemini";

/*
 * AI illustration pipeline.
 *
 * Two generators, chosen automatically:
 *  1. "image" – Gemini image model (photo-quality 3D storybook pictures). Needs a billed API key.
 *  2. "svg"   – Gemini text model *draws* the picture as SVG vector code. Works on the FREE tier.
 *
 * IMAGE_MODE env: "auto" (default: try image, fall back to svg), "image", "svg".
 * Every picture is cached on disk (.ai-guru-cache/) so each one is generated only once.
 */

export const CACHE_DIR = process.env.VERCEL ? "/tmp/ai-guru-cache/illustrations" : path.join(process.cwd(), ".ai-guru-cache", "illustrations");

let imageModelBlockedUntil = 0; // after a billing/quota error we stop trying the image model for a while

export interface IllustrationRequest {
  title: string;
  description: string; // English visual description from the lesson
  chapter: string;
  seed: number;
}

export function illustrationKey(r: IllustrationRequest, kind: string) {
  return createHash("sha1").update(`${kind}|v1|${r.chapter}|${r.title}|${r.description}`).digest("hex").slice(0, 20);
}

export async function findCached(r: IllustrationRequest): Promise<{ id: string; kind: "png" | "svg" } | null> {
  for (const kind of ["png", "svg"] as const) {
    const id = illustrationKey(r, kind);
    try {
      await readFile(path.join(CACHE_DIR, `${id}.${kind}`));
      return { id, kind };
    } catch {
      /* not cached */
    }
  }
  return null;
}

const STYLE =
  "cute 3D storybook illustration for Indian primary-school children, soft rounded shapes, bright cheerful colours, warm lighting, friendly expressive characters, simple uncluttered background, Indian village or school setting when it fits";

export async function generateIllustration(r: IllustrationRequest): Promise<{ id: string; kind: "png" | "svg" }> {
  const mode = process.env.IMAGE_MODE || "auto";
  await mkdir(CACHE_DIR, { recursive: true });

  if ((mode === "image" || mode === "auto") && Date.now() > imageModelBlockedUntil) {
    try {
      const png = await generateRaster(r);
      const id = illustrationKey(r, "png");
      await writeFile(path.join(CACHE_DIR, `${id}.png`), png);
      return { id, kind: "png" };
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0;
      console.warn(`[illustrate] image model unavailable (status ${status || "?"}) – using SVG drawing instead`);
      // free tier / no billing / model missing → don't retry the image model for 30 minutes
      imageModelBlockedUntil = Date.now() + 30 * 60_000;
      if (mode === "image") throw toFriendly(err);
    }
  }

  const svg = await generateSvg(r);
  const id = illustrationKey(r, "svg");
  await writeFile(path.join(CACHE_DIR, `${id}.svg`), svg, "utf8");
  return { id, kind: "svg" };
}

async function generateRaster(r: IllustrationRequest): Promise<Buffer> {
  const ai = getClient();
  const res = await withModel("image", (model) =>
    ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${STYLE}. Scene: ${r.description} (from the lesson "${r.title}" in the chapter "${r.chapter}"). No text, no letters, no watermark. Wide 16:9 composition.`,
          },
        ],
      },
    ],
    config: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "16:9" } },
  }),
  );
  const part = res.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!part?.inlineData?.data) throw new FriendlyError("BAD_OUTPUT", 502, "No image returned");
  return Buffer.from(part.inlineData.data, "base64");
}

const PALETTES = [
  "sky blue #8fd3ff, grass green #7ed957, sun yellow #ffd23f, warm orange #ff8a3d",
  "peach #ffd6a5, mint #9be1c4, coral #ff6b6b, lilac #b8a6ff",
  "lavender #c3b5ff, teal #2ec4b6, mango #ffbe0b, pink #ff8fb1",
];

async function generateSvg(r: IllustrationRequest): Promise<string> {
  const ai = getClient();
  const prompt = `Draw this scene as one SVG illustration for a children's storybook.

SCENE: ${r.description}
LESSON PART: "${r.title}" (chapter "${r.chapter}")

ART DIRECTION
- Style: ${STYLE}. Make it look 3D using linearGradient/radialGradient shading, soft drop shadows (an ellipse under each character), highlights on round shapes.
- Palette: ${PALETTES[r.seed % PALETTES.length]} plus natural colours as needed.
- Layers: sky gradient background → distant hills/trees → ground → main characters in the front centre (large, at least 40% of the height) → small details.
- Characters must be clearly recognisable (e.g. a monkey has a round face, big ears, a curly tail; a person has a face, hair, clothes) with big friendly eyes and smiles.
- Show exactly what the scene describes so a child understands the lesson from the picture.

TECHNICAL RULES
- Output ONLY the SVG code, starting with <svg and ending with </svg>. No markdown, no explanation.
- <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450">, fill the whole canvas.
- Use only: g, path, circle, ellipse, rect, polygon, polyline, line, defs, linearGradient, radialGradient, stop, filter (feGaussianBlur/feDropShadow), clipPath.
- No <text>, no <image>, no scripts, no external links, no CSS @import. Keep it under 250 elements.`;

  let lastErr: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      // Drawings use the Lite model first: it has a much larger free daily quota than Flash,
      // so pictures never use up the requests needed for lessons.
      const res = await withModel(attempt < 3 ? "lite" : "text", (model) =>
        ai.models.generateContent({
          model,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: { temperature: tempFor(model, 0.8), maxOutputTokens: 20000 },
        }),
      );
      const svg = sanitizeSvg(res.text ?? "");
      if (svg) return svg;
      throw new FriendlyError("BAD_OUTPUT", 502, "Drawing was empty");
    } catch (err) {
      lastErr = err;
      const status = err instanceof ApiError ? err.status : 0;
      if (status === 400 || status === 401 || status === 403) break;
      if (isDailyQuota(err)) {
        attempt = 2; // Lite quota used up for today → last try on the Flash model
        continue;
      }
      await new Promise((res) => setTimeout(res, (status === 429 ? 8000 : 2000) * (attempt + 1)));
    }
  }
  throw toFriendly(lastErr);
}

/** Keep only safe drawing markup. (Pictures are also shown via <img>, where SVG scripts can never run.) */
export function sanitizeSvg(raw: string): string | null {
  const m = raw.match(/<svg[\s\S]*<\/svg>/i);
  if (!m) return null;
  let svg = m[0];
  svg = svg
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<(foreignObject|image|iframe|a)\b[\s\S]*?(<\/\1>|\/>)/gi, "")
    .replace(/@import[^;]*;?/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*')/gi, "")
    .replace(/(xlink:)?href\s*=\s*("(?!#)[^"]*"|'(?!#)[^']*')/gi, "")
    .replace(/<text[\s\S]*?<\/text>/gi, "")
    .replace(/url\(\s*['"]?(?!#)[^)]*\)/gi, "none");
  if (!/xmlns=/.test(svg)) svg = svg.replace(/<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
  if (!/viewBox=/i.test(svg)) svg = svg.replace(/<svg/i, '<svg viewBox="0 0 800 450"');
  // must still contain some shapes
  if ((svg.match(/<(path|circle|ellipse|rect|polygon)\b/gi) || []).length < 5) return null;
  return svg;
}
