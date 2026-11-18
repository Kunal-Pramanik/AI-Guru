"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bubble, Confetti, GuruOwl, LangSwitch, Sheet, SpeakButton, SubtopicPicture, Toast } from "@/components/ui";
import { ExploreStage } from "@/components/stages/Explore";
import { AchievementsStage, NotesStage, ProgressRing, QuizStage } from "@/components/stages/NotesQuizAch";
import { WatchStage } from "@/components/stages/Watch";
import { totalStars, type StageProps } from "@/components/stages/shared";
import { useIllustrations } from "@/lib/useIllustrations";
import { chapterKey } from "@/lib/lesson";
import { emptyProgress, LEARNING_STAGES, loadProgress, saveProgress } from "@/lib/progress";
import { t } from "@/lib/i18n";
import { useSpeech } from "@/lib/useSpeech";
import { STORAGE_KEYS, type Lang, type Lesson, type Progress, type StageId, type Student } from "@/lib/types";

const STAGES: { id: StageId; icon: string; color: string; bg: string }[] = [
  { id: "watch", icon: "🎬", color: "#ff5c8a", bg: "from-berry to-[#ff8fb1]" },
  { id: "explore", icon: "🎲", color: "#2fa8ff", bg: "from-ocean to-[#7fd0ff]" },
  { id: "notes", icon: "📝", color: "#34c38f", bg: "from-leaf to-[#86e3b9]" },
  { id: "quiz", icon: "🧠", color: "#7c5cff", bg: "from-grape to-[#a990ff]" },
  { id: "achievements", icon: "🏆", color: "#ff8a3d", bg: "from-tang to-sun" },
];

export default function LearnPage() {
  const router = useRouter();
  const [original, setOriginal] = useState<Lesson | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [bookId, setBookId] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [lang, setLang] = useState<Lang>("en");
  const [translations, setTranslations] = useState<Partial<Record<Lang, Lesson>>>({});
  const [translating, setTranslating] = useState(false);
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [open, setOpen] = useState<StageId | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confetti, setConfetti] = useState(false);
  const warnedRef = useRef(new Set<Lang>());
  const speech = useSpeech(lang);
  const { speak, stop: stopSpeech } = speech;
  const tr = t(lang);
  const pics = useIllustrations(original);

  const pKey = useMemo(() => (original ? chapterKey(original, bookId) : null), [original, bookId]);

  const update = useCallback(
    (fn: (p: Progress) => Progress) => {
      setProgress((prev) => {
        const next = fn(prev);
        if (next === prev) return prev;
        if (pKey) saveProgress(pKey, next);
        return next;
      });
    },
    [pKey],
  );

  /* ---------- language switching with caching ---------- */
  async function switchLang(target: Lang, base?: Lesson, cache?: Partial<Record<Lang, Lesson>>) {
      const src = base ?? original;
      const have = cache ?? translations;
      stopSpeech();
      if (!src) return;
      if (have[target]) {
        setLang(target);
        return;
      }
      setTranslating(true);
      try {
        const res = await fetch("/api/translate-lessons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lesson: src, targetLanguage: target }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.lesson) throw new Error(data.error || "translate failed");
        const lesson = data.lesson as Lesson;
        sessionStorage.setItem(STORAGE_KEYS.translationPrefix + target, JSON.stringify(lesson));
        setTranslations((prev) => ({ ...prev, [target]: lesson }));
        setLang(target);
        // remember the child's language choice
        setStudent((s) => {
          if (!s) return s;
          const ns = { ...s, language: target };
          sessionStorage.setItem(STORAGE_KEYS.student, JSON.stringify(ns));
          try {
            localStorage.setItem(STORAGE_KEYS.studentSaved, JSON.stringify(ns));
          } catch {}
          return ns;
        });
      } catch {
        setToast(t(target).translateFail);
      } finally {
        setTranslating(false);
      }
  }

  /* ---------- hydrate from session storage ---------- */
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEYS.lessons);
      const st = sessionStorage.getItem(STORAGE_KEYS.student) || localStorage.getItem(STORAGE_KEYS.studentSaved);
      if (!raw) {
        router.replace("/");
        return;
      }
      const lesson = JSON.parse(raw) as Lesson;
      const s = st ? (JSON.parse(st) as Student) : null;
      const book = sessionStorage.getItem(STORAGE_KEYS.bookId) || null;
      const cached: Partial<Record<Lang, Lesson>> = { [lesson.language]: lesson };
      for (const l of ["en", "hi", "gu"] as Lang[]) {
        const c = sessionStorage.getItem(STORAGE_KEYS.translationPrefix + l);
        if (c) cached[l] = JSON.parse(c) as Lesson;
      }
      /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from browser storage */
      setOriginal(lesson);
      setStudent(s);
      setBookId(book);
      setIsDemo(sessionStorage.getItem(STORAGE_KEYS.isDemo) === "1");
      setTranslations(cached);
      setLang(s?.language && cached[s.language] ? s.language : lesson.language);
      setProgress(loadProgress(chapterKey(lesson, book)));
      /* eslint-enable react-hooks/set-state-in-effect */
      // If the child's language differs from the generated lesson, translate in the background.
      if (s?.language && !cached[s.language]) void switchLang(s.language, lesson, cached);
    } catch {
      router.replace("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const lesson = translations[lang] ?? original;

  const say = useCallback<StageProps["say"]>(
    (id, text, opts) => {
      const ok = speak(id, text, opts);
      // tell the child once per language, not on every tap
      if (!ok && !warnedRef.current.has(lang)) {
        warnedRef.current.add(lang);
        setToast(tr.noVoice);
      }
    },
    [speak, tr.noVoice, lang],
  );

  const celebrate = useCallback(() => {
    setConfetti(true);
    setTimeout(() => setConfetti(false), 4200);
  }, []);

  const closeStage = useCallback(() => {
    stopSpeech();
    setOpen(null);
  }, [stopSpeech]);

  if (!lesson || !original) {
    return (
      <main className="grid min-h-dvh place-items-center">
        <GuruOwl size={140} className="anim-floaty" />
      </main>
    );
  }

  const stageProps: StageProps = { lesson, tr, lang, bookId, speech, progress, update, say, celebrate, pics };
  const doneCount = LEARNING_STAGES.filter((s) => progress.stagesDone[s]).length;
  const stars = totalStars(progress);
  const stageText: Record<StageId, [string, string]> = {
    watch: [tr.stage_watch, tr.stage_watch_sub],
    explore: [tr.stage_explore, tr.stage_explore_sub],
    notes: [tr.stage_notes, tr.stage_notes_sub],
    quiz: [tr.stage_quiz, tr.stage_quiz_sub],
    achievements: [tr.stage_achievements, tr.stage_achievements_sub],
  };
  const motivation = doneCount === 0 ? tr.motivate0 : doneCount === LEARNING_STAGES.length ? tr.motivateAll : tr.motivateSome;
  const overviewId = "overview";
  const openStage = open ? STAGES.find((s) => s.id === open)! : null;

  const newChapter = () => {
    speech.stop();
    router.push("/");
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-3 sm:px-6" lang={lang}>
      {/* Top bar */}
      <header className="sticky top-0 z-30 -mx-4 mb-4 flex flex-wrap items-center justify-between gap-2 bg-[#eef3ff]/85 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <button onClick={newChapter} className="flex items-center gap-2" aria-label={tr.newChapter}>
          <GuruOwl size={46} />
          <span className="hidden text-2xl font-extrabold text-grape sm:inline">{tr.appName}</span>
        </button>
        <LangSwitch value={lang} onChange={(l) => switchLang(l)} busy={translating} />
        <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1 shadow">
          <span className="text-2xl">{student?.avatar ?? "🙂"}</span>
          <span className="max-w-[7rem] truncate text-lg font-extrabold">{student?.name}</span>
          <span className="rounded-full bg-sun px-2 text-lg font-extrabold">⭐ {stars}</span>
        </div>
      </header>

      {translating && (
        <div className="anim-in mb-4 flex items-center justify-center gap-3 rounded-3xl bg-grape/10 p-3 text-xl font-bold text-grape" role="status">
          <span className="anim-wiggle text-3xl">🌐</span> {tr.translating}
        </div>
      )}

      {/* Chapter hero */}
      <section className="card mb-6 overflow-hidden">
        <div className="grid sm:grid-cols-5">
          <SubtopicPicture
            pic={pics[lesson.subtopics[0]?.order]}
            drawingLabel={tr.drawing}
            emoji={lesson.subtopics.map((s) => s.emoji).join("")}
            seed={2}
            title={lesson.chapterTitle}
            animate
            className="aspect-video sm:col-span-2 sm:aspect-auto sm:min-h-[16rem]"
          />
          <div className="flex flex-col gap-3 p-5 sm:col-span-3 sm:p-6">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-grape/10 px-3 py-1 text-base font-extrabold text-grape">📖 {tr.todaysChapter}</span>
              {isDemo && <span className="rounded-full bg-sun px-3 py-1 text-base font-extrabold">✨ {tr.demoBadge}</span>}
              <span className="rounded-full bg-ink/5 px-3 py-1 text-base font-bold">
                🧩 {tr.part} 1–{lesson.subtopics.length}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">{lesson.chapterTitle}</h1>
            <p className="text-xl leading-relaxed text-ink/75">{lesson.overview}</p>
            <div className="mt-auto flex flex-wrap items-center gap-4">
              <SpeakButton
                active={speech.speakingId === overviewId}
                onClick={() => (speech.speakingId === overviewId ? speech.stop() : say(overviewId, `${lesson.chapterTitle}. ${lesson.overview}`))}
                label={tr.listen}
                stopLabel={tr.stop}
              />
              <div className="flex items-center gap-2">
                <ProgressRing pct={Math.round((doneCount / LEARNING_STAGES.length) * 100)} size={64} />
                <span className="text-lg font-bold">
                  {doneCount}/{LEARNING_STAGES.length} {tr.stagesDone}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Guru says */}
      <div className="mb-5 flex items-center gap-3">
        <GuruOwl size={72} className="anim-floaty shrink-0" />
        <Bubble>
          {tr.hi} {student?.name}! {motivation}
        </Bubble>
      </div>

      {/* Journey: 5 stages */}
      <h2 className="mb-3 text-2xl font-extrabold">🗺️ {tr.yourJourney}</h2>
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {STAGES.map((s, i) => {
          const done = progress.stagesDone[s.id];
          return (
            <button
              key={s.id}
              onClick={() => setOpen(s.id)}
              className={`btn3d anim-in relative flex flex-col items-center gap-1 bg-gradient-to-br ${s.bg} px-3 pb-5 pt-6 text-center text-white ${
                i === 4 ? "col-span-2 lg:col-span-1" : ""
              }`}
              style={{ animationDelay: `${i * 0.07}s` }}
            >
              <span className="absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/30 text-lg font-extrabold">{i + 1}</span>
              {done && <span className="anim-pop absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white text-xl">✅</span>}
              <span className="anim-floaty text-6xl drop-shadow" style={{ animationDelay: `${i * 0.25}s` }}>
                {s.icon}
              </span>
              <span className="text-xl leading-tight sm:text-2xl">{stageText[s.id][0]}</span>
              <span className="text-sm font-semibold opacity-90 sm:text-base">{stageText[s.id][1]}</span>
              <span className="mt-2 rounded-full bg-white/95 px-4 py-1 text-base font-extrabold" style={{ color: s.color }}>
                {done ? tr.done : s.id === "achievements" ? `⭐ ${stars}` : tr.start} →
              </span>
            </button>
          );
        })}
      </section>

      <Sheet
        open={!!open}
        onClose={closeStage}
        title={openStage ? stageText[openStage.id][0] : ""}
        color={openStage?.color}
        icon={openStage?.icon}
        closeLabel={tr.close}
      >
        {open === "watch" && <WatchStage {...stageProps} />}
        {open === "explore" && <ExploreStage {...stageProps} />}
        {open === "notes" && <NotesStage {...stageProps} />}
        {open === "quiz" && <QuizStage key={lang} {...stageProps} />}
        {open === "achievements" && <AchievementsStage {...stageProps} onNewChapter={newChapter} />}
      </Sheet>

      <Confetti show={confetti} />
      <Toast msg={toast} onDone={() => setToast(null)} />
    </main>
  );
}
