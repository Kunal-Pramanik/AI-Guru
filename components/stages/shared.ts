import type { Dict } from "@/lib/i18n";
import type { useSpeech } from "@/lib/useSpeech";
import type { Lang, Lesson, Progress } from "@/lib/types";
import type { PicState } from "@/lib/useIllustrations";

export interface StageProps {
  lesson: Lesson;
  tr: Dict;
  lang: Lang;
  bookId: string | null;
  speech: ReturnType<typeof useSpeech>;
  progress: Progress;
  update: (fn: (p: Progress) => Progress) => void;
  /** speak helper that shows a toast when no voice is installed */
  say: (id: string, text: string, opts?: { onEnd?: () => void; startAt?: number }) => void;
  celebrate: () => void;
  /** AI illustrations by subtopic order */
  pics: Record<number, PicState>;
}

export function totalStars(p: Progress): number {
  return p.storiesWatched.length + p.discovered.length + p.matchStars + p.challengeBest + p.quizBest + (p.notesRead ? 2 : 0);
}

export function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

export const addUnique = (arr: number[], n: number) => (arr.includes(n) ? arr : [...arr, n]);
