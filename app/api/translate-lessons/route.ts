import { NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/diskCache";
import { FriendlyError, generateJson, toFriendly } from "@/lib/gemini";
import { alignTranslation, normalizeLesson, translatablePayload } from "@/lib/lesson";
import { LANGUAGE_NAMES, translationSchema } from "@/lib/schema";
import type { Lang, Lesson } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

// Small in-memory server cache (survives while `npm run dev` is running).
const cache = new Map<string, Lesson>();

function hash(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { lesson?: unknown; targetLanguage?: string };
    const target = body.targetLanguage as Lang;
    if (!["en", "hi", "gu"].includes(target)) throw new FriendlyError("BAD_INPUT", 400, "Unknown language.");
    const srcLang = ((body.lesson as Lesson)?.language || "en") as Lang;
    let source: Lesson;
    try {
      source = normalizeLesson(body.lesson, srcLang);
    } catch {
      throw new FriendlyError("BAD_INPUT", 400, "No lesson to translate.");
    }
    if (source.language === target) return NextResponse.json({ lesson: source, cached: true });

    const payload = translatablePayload(source);
    const key = target + ":" + hash(JSON.stringify(payload));
    const hit = cache.get(key) ?? (await readJson<Lesson>("translations", key.replace(":", "-")));
    if (hit) {
      cache.set(key, hit);
      return NextResponse.json({ lesson: hit, cached: true });
    }

    const raw = await generateJson({
      system: `You translate children's lesson content for Classes 1–5 into ${LANGUAGE_NAMES[target]}.
Rules: translate EVERY string value; keep the exact same JSON structure, the same number of array items and the same order.
Keep meaning identical — do not add, remove or change facts. Use simple, everyday words a village child would use.
Keep names of people and characters recognisable (transliterate them). Keep emojis and **double star** markers exactly where they are.
Translate quiz options one-to-one in the same order. Keep line breaks (\\n) in multi-line fields.`,
      parts: [{ text: JSON.stringify(payload) }],
      schema: translationSchema,
      temperature: 0.2,
      timeoutMs: 110_000,
    });

    const lesson = alignTranslation(source, raw, target);
    cache.set(key, lesson);
    await writeJson("translations", key.replace(":", "-"), lesson);
    return NextResponse.json({ lesson, cached: false });
  } catch (err) {
    const fe = toFriendly(err);
    console.error("[translate-lessons]", fe.code, (err as Error)?.message);
    return NextResponse.json({ error: fe.message, code: fe.code }, { status: fe.status });
  }
}
