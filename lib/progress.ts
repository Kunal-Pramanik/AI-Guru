import { STORAGE_KEYS, type Progress, type StageId } from "./types";

// Learning progress is stored in localStorage so it survives refresh and revisits
// on the same device (no database needed for the PoC).

export const emptyProgress = (): Progress => ({
  stagesDone: { watch: false, explore: false, notes: false, quiz: false, achievements: false },
  storiesWatched: [],
  discovered: [],
  matchStars: 0,
  challengeBest: 0,
  quizBest: 0,
  quizTotal: 0,
  quizAttempts: 0,
  notesRead: false,
});

export function loadProgress(key: string): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.progressPrefix + key);
    if (!raw) return emptyProgress();
    const p = JSON.parse(raw) as Partial<Progress>;
    const base = emptyProgress();
    return { ...base, ...p, stagesDone: { ...base.stagesDone, ...(p.stagesDone || {}) } };
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(key: string, p: Progress) {
  try {
    localStorage.setItem(STORAGE_KEYS.progressPrefix + key, JSON.stringify(p));
  } catch {
    /* storage full / private mode – progress just won't persist */
  }
}

export const LEARNING_STAGES: StageId[] = ["watch", "explore", "notes", "quiz"];

export interface Badge {
  id: "story" | "explorer" | "matcher" | "reader" | "quiz" | "champion";
  emoji: string;
  earned: boolean;
}

export function badgesFor(p: Progress, subtopicCount: number): Badge[] {
  const allDone = LEARNING_STAGES.every((s) => p.stagesDone[s]);
  return [
    { id: "story", emoji: "📚", earned: p.storiesWatched.length >= Math.min(2, subtopicCount) },
    { id: "explorer", emoji: "🧭", earned: p.discovered.length >= subtopicCount },
    { id: "matcher", emoji: "🧩", earned: p.matchStars >= 3 },
    { id: "reader", emoji: "📝", earned: p.notesRead },
    { id: "quiz", emoji: "🏆", earned: p.quizTotal > 0 && p.quizBest / p.quizTotal >= 0.8 },
    { id: "champion", emoji: "👑", earned: allDone },
  ];
}
