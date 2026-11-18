// Shared data types for AI Guru. The API routes validate Gemini output into these shapes.

export type Lang = "en" | "hi" | "gu";

export const LANGS: Lang[] = ["en", "hi", "gu"];

export interface Student {
  name: string;
  classLevel: number; // 1–5
  language: Lang;
  preference: "stories" | "pictures" | "games" | "listening";
  avatar: string; // emoji
}

export interface Subtopic {
  order: number;
  title: string;
  sourceContent: string; // short summary of what the textbook says (grounding)
  storyScript: string; // child-friendly story for this subtopic
  visualDescription: string; // what the illustration should show
  explanation: string; // simple explanation (Discover & Learn)
  keyPoints: string[]; // 2–4 short facts
  emoji: string; // 1–3 emojis used for scene art
}

export interface QuizQuestion {
  question: string;
  options: string[]; // exactly 4
  answer: string; // exact text of the correct option
  answerIndex: number; // index into options (kept aligned across translations)
  explanation: string;
}

export interface MatchPair {
  left: string; // e.g. a character / word
  right: string; // its matching fact / meaning
  emoji: string;
}

export interface Challenge {
  type: "truefalse" | "flashcard";
  prompt: string; // statement (true/false) or question (flashcard)
  answer: string; // answer text for flashcards (and the correction for false statements)
  isTrue: boolean; // only meaningful for truefalse
  explanation: string;
}

export interface KeyWord {
  word: string;
  meaning: string;
}

export interface Lesson {
  chapterTitle: string;
  overview: string;
  subtopics: Subtopic[];
  storyLesson: string;
  smartNotes: string; // one note per line
  keyWords: KeyWord[];
  quiz: QuizQuestion[];
  matchPairs: MatchPair[];
  challenges: Challenge[];
  language: Lang;
}

export interface Progress {
  stagesDone: Record<StageId, boolean>;
  storiesWatched: number[]; // subtopic orders; 0 = full chapter story
  discovered: number[];
  matchStars: number;
  challengeBest: number;
  quizBest: number; // correct answers
  quizTotal: number;
  quizAttempts: number;
  notesRead: boolean;
}

export type StageId = "watch" | "explore" | "notes" | "quiz" | "achievements";

export const STORAGE_KEYS = {
  lessons: "aiGuruLessons",
  student: "aiGuruStudent",
  chapterName: "aiGuruChapterName",
  bookId: "aiGuruBookId",
  isDemo: "aiGuruIsDemo",
  translationPrefix: "aiGuruLessons_", // + lang  (translation cache)
  progressPrefix: "aiGuruProgress_", // + chapter key (localStorage, survives refresh)
  studentSaved: "aiGuruStudentSaved", // localStorage copy of the profile
} as const;
