import { NextResponse } from "next/server";
import { hashOf, readJson, writeJson } from "@/lib/diskCache";
import { FriendlyError, filesToParts, generateJson, toFriendly } from "@/lib/gemini";
import { normalizeLesson } from "@/lib/lesson";
import { LANGUAGE_NAMES, lessonSchema } from "@/lib/schema";
import type { Lang } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_FILES = 8;
const MAX_SIZE = 15 * 1024 * 1024;
const ALLOWED = /^(application\/pdf|image\/(png|jpe?g|webp|heic|heif))$/;

function detectBookId(names: string[]): string | null {
  for (const n of names) {
    const m = n.toLowerCase().match(/aemr10[34]/);
    if (m) return m[0];
  }
  return null;
}

function systemPrompt(classLevel: number, lang: Lang, preference: string) {
  return `You are "Guru", a warm, patient teacher for Indian primary-school children (Class ${classLevel}).
You turn textbook pages into a playful learning pack. Many children are from rural areas and are first-generation learners.

STRICT GROUNDING RULES
- Use ONLY facts, characters, words and events that appear in the uploaded pages. Never invent textbook facts or add unrelated topics.
- Keep the chapter's own order. Split it into 2–6 meaningful subtopics (a poem, a story section, an activity…).
- If a page is an activity (match, colour, count), describe what the child does in it.
- sourceContent: 1–3 sentences saying what the textbook page actually contains for this subtopic.

LANGUAGE
- Write EVERY text field in ${LANGUAGE_NAMES[lang]}. Use very simple words for a ${classLevel + 5}-year-old. Short sentences (max ~12 words).
- Child prefers learning through: ${preference}.

FIELDS
- storyScript: a 5–8 sentence warm story for the subtopic, narrated by Guru the owl, based only on that subtopic. Each sentence on its own line.
- explanation: 2–4 simple sentences explaining the idea.
- keyPoints: 2–4 very short facts from the page.
- visualDescription: in ENGLISH, one sentence describing a cute 3D storybook illustration for this subtopic.
- emoji: 2–3 emojis that show the subtopic (e.g. "🐒🧢🌳").
- storyLesson: the whole chapter as one connected story (8–14 sentences, one per line).
- smartNotes: 5–8 short revision notes. Wrap the most important word in **double stars**.
- keyWords: 3–6 important words from the chapter with child-friendly meanings.
- quiz: 5 multiple-choice questions, exactly 4 options each, one clearly correct. "answer" must be the EXACT text of the correct option. Explanation is kind and short.
- matchPairs: 4 pairs that are clearly and uniquely correct (e.g. character ↔ what they did, word ↔ meaning, number ↔ count of things). No two lefts may fit the same right. Short text (max 6 words each side).
- challenges: exactly 3 DIFFERENT challenges about 3 different facts: at least one "truefalse" (set isTrue honestly; for a false statement put the correct fact in "answer") and at least one "flashcard" (prompt is a question, answer is short).`;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    const classLevel = Math.min(5, Math.max(1, Number(form.get("classLevel")) || 1));
    const langRaw = String(form.get("language") || "en");
    const language: Lang = langRaw === "hi" || langRaw === "gu" ? langRaw : "en";
    const preference = String(form.get("preference") || "stories").slice(0, 30);

    if (files.length === 0) throw new FriendlyError("BAD_INPUT", 400, "Please add at least one textbook page.");
    if (files.length > MAX_FILES) throw new FriendlyError("BAD_INPUT", 400, `Please upload at most ${MAX_FILES} files.`);
    for (const f of files) {
      if (f.size > MAX_SIZE) throw new FriendlyError("BAD_INPUT", 400, `${f.name} is bigger than 15 MB.`);
      if (f.type && !ALLOWED.test(f.type)) throw new FriendlyError("BAD_INPUT", 400, `${f.name} is not a PDF or image.`);
    }

    // Same pages + same settings → reuse the saved lesson (0 API requests, instant).
    const buffers = await Promise.all(files.map(async (f) => Buffer.from(await f.arrayBuffer())));
    const cacheKey = hashOf("lesson-v1", String(classLevel), language, preference, ...buffers);
    const bookId = detectBookId(files.map((f) => f.name));
    const saved = await readJson<{ lesson: unknown }>("lessons", cacheKey);
    if (saved?.lesson) {
      const lesson = normalizeLesson(saved.lesson, language);
      return NextResponse.json({ lesson, bookId, chapterName: lesson.chapterTitle, cached: true });
    }

    const parts = await filesToParts(files);
    parts.push({
      text: "Here are the textbook pages. Create the learning pack as JSON following all the rules.",
    });

    const raw = await generateJson({
      parts,
      system: systemPrompt(classLevel, language, preference),
      schema: lessonSchema,
      temperature: 0.35,
    });

    let lesson;
    try {
      lesson = normalizeLesson(raw, language);
    } catch {
      throw new FriendlyError("BAD_OUTPUT", 502, "Guru could not find lessons on these pages. Try clearer pages.");
    }

    await writeJson("lessons", cacheKey, { lesson, savedAt: new Date().toISOString() });
    return NextResponse.json({ lesson, bookId, chapterName: lesson.chapterTitle, cached: false });
  } catch (err) {
    const fe = toFriendly(err);
    console.error("[prepare-lessons]", fe.code, (err as Error)?.message);
    return NextResponse.json({ error: fe.message, code: fe.code }, { status: fe.status });
  }
}
