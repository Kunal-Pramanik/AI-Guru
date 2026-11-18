import type { Challenge, KeyWord, Lang, Lesson, MatchPair, QuizQuestion, Subtopic } from "./types";

/* ------------------------------------------------------------------ */
/* Validation / normalisation of model output.                         */
/* Gemini output is never trusted blindly: every field is coerced into */
/* the expected shape and quiz answers are re-aligned to options.      */
/* ------------------------------------------------------------------ */

const str = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : fallback;

const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

export function findAnswerIndex(options: string[], answer: string, hint?: unknown): number {
  if (typeof hint === "number" && hint >= 0 && hint < options.length) return Math.floor(hint);
  const a = norm(answer);
  let idx = options.findIndex((o) => norm(o) === a);
  if (idx >= 0) return idx;
  // "B", "Option B", "b)"…
  const letter = answer.trim().match(/^(?:option\s*)?([a-d])[\).:\s]*$/i);
  if (letter) return "abcd".indexOf(letter[1].toLowerCase());
  idx = options.findIndex((o) => a && (norm(o).includes(a) || a.includes(norm(o))));
  return idx >= 0 ? idx : 0;
}

function normSubtopic(raw: unknown, i: number): Subtopic | null {
  const o = obj(raw);
  const title = str(o.title);
  const story = str(o.storyScript);
  if (!title && !story) return null;
  const keyPoints = arr(o.keyPoints).map((k) => str(k)).filter(Boolean).slice(0, 4);
  return {
    order: i + 1,
    title: title || `Part ${i + 1}`,
    sourceContent: str(o.sourceContent),
    storyScript: story || str(o.explanation),
    visualDescription: str(o.visualDescription),
    explanation: str(o.explanation) || str(o.sourceContent),
    keyPoints,
    emoji: str(o.emoji, "📖").slice(0, 12) || "📖",
  };
}

function normQuiz(raw: unknown): QuizQuestion | null {
  const o = obj(raw);
  const question = str(o.question);
  let options = arr(o.options).map((x) => str(x)).filter(Boolean);
  if (!question || options.length < 2) return null;
  options = Array.from(new Set(options)).slice(0, 4);
  const answerIndex = findAnswerIndex(options, str(o.answer), o.answerIndex);
  return {
    question,
    options,
    answerIndex,
    answer: options[answerIndex],
    explanation: str(o.explanation),
  };
}

function normPair(raw: unknown): MatchPair | null {
  const o = obj(raw);
  const left = str(o.left);
  const right = str(o.right);
  if (!left || !right || norm(left) === norm(right)) return null;
  return { left, right, emoji: str(o.emoji, "⭐") || "⭐" };
}

function normChallenge(raw: unknown): Challenge | null {
  const o = obj(raw);
  const prompt = str(o.prompt);
  if (!prompt) return null;
  const type = str(o.type) === "flashcard" ? "flashcard" : "truefalse";
  return {
    type,
    prompt,
    answer: str(o.answer),
    isTrue: o.isTrue === true || str(o.isTrue).toLowerCase() === "true",
    explanation: str(o.explanation),
  };
}

/** Build match pairs from subtopics when the model did not supply enough. */
export function deriveMatchPairs(lesson: Pick<Lesson, "subtopics" | "keyWords">): MatchPair[] {
  const fromWords = lesson.keyWords.map((k) => ({ left: k.word, right: k.meaning, emoji: "🔤" }));
  const fromSubs = lesson.subtopics
    .filter((s) => s.keyPoints[0])
    .map((s) => ({ left: s.title, right: s.keyPoints[0], emoji: firstEmoji(s.emoji) }));
  return dedupePairs([...fromWords, ...fromSubs]).slice(0, 4);
}

/** Build quick challenges from quiz questions when the model did not supply enough. */
export function deriveChallenges(quiz: QuizQuestion[]): Challenge[] {
  return quiz.slice(0, 3).map((q, i) =>
    i === 1 && q.options.length > 1
      ? {
          type: "truefalse" as const,
          // Present a wrong option as a statement to check (clearly framed as Q + option).
          prompt: `${q.question} → ${q.options[(q.answerIndex + 1) % q.options.length]}`,
          answer: q.answer,
          isTrue: false,
          explanation: q.explanation,
        }
      : {
          type: "flashcard" as const,
          prompt: q.question,
          answer: q.answer,
          isTrue: true,
          explanation: q.explanation,
        },
  );
}

function dedupePairs(pairs: MatchPair[]): MatchPair[] {
  const seenL = new Set<string>();
  const seenR = new Set<string>();
  return pairs.filter((p) => {
    const l = norm(p.left);
    const r = norm(p.right);
    if (!l || !r || seenL.has(l) || seenR.has(r)) return false;
    seenL.add(l);
    seenR.add(r);
    return true;
  });
}

export function firstEmoji(s: string): string {
  const m = s.match(/\p{Extended_Pictographic}(️|‍\p{Extended_Pictographic})*/u);
  return m ? m[0] : "⭐";
}

export function normalizeLesson(raw: unknown, language: Lang): Lesson {
  const o = obj(raw);
  const subtopics = arr(o.subtopics)
    .map((s, i) => normSubtopic(s, i))
    .filter((s): s is Subtopic => !!s)
    .slice(0, 8)
    .map((s, i) => ({ ...s, order: i + 1 }));
  if (subtopics.length === 0) throw new Error("NO_SUBTOPICS");

  const keyWords: KeyWord[] = arr(o.keyWords)
    .map((k) => ({ word: str(obj(k).word), meaning: str(obj(k).meaning) }))
    .filter((k) => k.word && k.meaning)
    .slice(0, 8);

  const quiz = arr(o.quiz)
    .map(normQuiz)
    .filter((q): q is QuizQuestion => !!q)
    .slice(0, 10);

  let matchPairs = dedupePairs(arr(o.matchPairs).map(normPair).filter((p): p is MatchPair => !!p)).slice(0, 4);
  if (matchPairs.length < 3) matchPairs = dedupePairs([...matchPairs, ...deriveMatchPairs({ subtopics, keyWords })]).slice(0, 4);

  let challenges = arr(o.challenges).map(normChallenge).filter((c): c is Challenge => !!c);
  // remove duplicate prompts
  challenges = challenges.filter((c, i) => challenges.findIndex((d) => norm(d.prompt) === norm(c.prompt)) === i).slice(0, 3);
  if (challenges.length < 3) challenges = [...challenges, ...deriveChallenges(quiz)].slice(0, 3);

  const smartNotesRaw = o.smartNotes;
  const smartNotes = Array.isArray(smartNotesRaw)
    ? smartNotesRaw.map((x) => str(x)).filter(Boolean).join("\n")
    : str(smartNotesRaw);

  return {
    chapterTitle: str(o.chapterTitle) || "My Chapter",
    overview: str(o.overview),
    subtopics,
    storyLesson: str(o.storyLesson) || subtopics.map((s) => s.storyScript).join("\n\n"),
    smartNotes: smartNotes || subtopics.flatMap((s) => s.keyPoints).join("\n"),
    keyWords,
    quiz,
    matchPairs,
    challenges,
    language,
  };
}

/**
 * After translation, force structural fields (orders, answer indices, true/false truth values, emojis)
 * to come from the source lesson, so a translation can never change which answer is correct.
 */
export function alignTranslation(source: Lesson, translatedRaw: unknown, language: Lang): Lesson {
  const t = obj(translatedRaw);
  const tSubs = arr(t.subtopics);
  const tQuiz = arr(t.quiz);
  const tPairs = arr(t.matchPairs);
  const tCh = arr(t.challenges);
  const tWords = arr(t.keyWords);
  const pick = (v: unknown, fb: string) => str(v) || fb;

  return {
    language,
    chapterTitle: pick(t.chapterTitle, source.chapterTitle),
    overview: pick(t.overview, source.overview),
    storyLesson: pick(t.storyLesson, source.storyLesson),
    smartNotes: Array.isArray(t.smartNotes)
      ? t.smartNotes.map((x) => str(x)).join("\n")
      : pick(t.smartNotes, source.smartNotes),
    subtopics: source.subtopics.map((s, i) => {
      const x = obj(tSubs[i]);
      const kp = arr(x.keyPoints).map((k) => str(k));
      return {
        ...s,
        title: pick(x.title, s.title),
        sourceContent: pick(x.sourceContent, s.sourceContent),
        storyScript: pick(x.storyScript, s.storyScript),
        visualDescription: s.visualDescription, // keep English for image matching
        explanation: pick(x.explanation, s.explanation),
        keyPoints: s.keyPoints.map((k, j) => kp[j] || k),
      };
    }),
    keyWords: source.keyWords.map((k, i) => {
      const x = obj(tWords[i]);
      return { word: pick(x.word, k.word), meaning: pick(x.meaning, k.meaning) };
    }),
    quiz: source.quiz.map((q, i) => {
      const x = obj(tQuiz[i]);
      const opts = arr(x.options).map((o) => str(o));
      const options = q.options.map((o, j) => opts[j] || o);
      return {
        question: pick(x.question, q.question),
        options,
        answerIndex: q.answerIndex,
        answer: options[q.answerIndex],
        explanation: pick(x.explanation, q.explanation),
      };
    }),
    matchPairs: source.matchPairs.map((p, i) => {
      const x = obj(tPairs[i]);
      return { ...p, left: pick(x.left, p.left), right: pick(x.right, p.right) };
    }),
    challenges: source.challenges.map((c, i) => {
      const x = obj(tCh[i]);
      return {
        ...c,
        prompt: pick(x.prompt, c.prompt),
        answer: pick(x.answer, c.answer),
        explanation: pick(x.explanation, c.explanation),
      };
    }),
  };
}

/** Text-only view of a lesson sent to the translator (no numeric/structural fields). */
export function translatablePayload(l: Lesson) {
  return {
    chapterTitle: l.chapterTitle,
    overview: l.overview,
    storyLesson: l.storyLesson,
    smartNotes: l.smartNotes,
    subtopics: l.subtopics.map((s) => ({
      title: s.title,
      sourceContent: s.sourceContent,
      storyScript: s.storyScript,
      explanation: s.explanation,
      keyPoints: s.keyPoints,
    })),
    keyWords: l.keyWords,
    quiz: l.quiz.map((q) => ({ question: q.question, options: q.options, explanation: q.explanation })),
    matchPairs: l.matchPairs.map((p) => ({ left: p.left, right: p.right })),
    challenges: l.challenges.map((c) => ({ prompt: c.prompt, answer: c.answer, explanation: c.explanation })),
  };
}

export function chapterKey(l: Pick<Lesson, "chapterTitle">, bookId: string | null): string {
  return (bookId || "book") + ":" + norm(l.chapterTitle).slice(0, 60);
}
