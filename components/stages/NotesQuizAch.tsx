"use client";

import { useState } from "react";
import { badgesFor, LEARNING_STAGES } from "@/lib/progress";
import { GuruOwl, Highlight, SpeakButton, StarRow, SubtopicPicture } from "@/components/ui";
import { totalStars, type StageProps } from "./shared";

const NOTE_COLORS = ["border-ocean bg-ocean/10", "border-berry bg-berry/10", "border-leaf bg-leaf/10", "border-tang bg-tang/10", "border-grape bg-grape/10"];
const NOTE_DOT = ["bg-ocean", "bg-berry", "bg-leaf", "bg-tang", "bg-grape"];

/* -------------------------------- Smart Notes ------------------------------- */
const wordsOf = (t: string) =>
  new Set(
    t
      .toLowerCase()
      .replace(/\*\*/g, "")
      .split(/[^\p{L}\p{N}\p{M}]+/u)
      .filter((w) => w.length > 2),
  );

/** Pick the subtopic a note talks about (word overlap), so it gets the matching AI picture. */
function subtopicForNote(note: string, lesson: StageProps["lesson"], i: number) {
  const nw = wordsOf(note);
  let best = -1;
  let bestScore = 0;
  lesson.subtopics.forEach((s, k) => {
    const sw = wordsOf(`${s.title} ${s.keyPoints.join(" ")} ${s.explanation} ${s.storyScript}`);
    let score = 0;
    nw.forEach((w) => sw.has(w) && score++);
    if (score > bestScore) {
      bestScore = score;
      best = k;
    }
  });
  return lesson.subtopics[best >= 0 ? best : i % lesson.subtopics.length];
}

export function NotesStage({ lesson, tr, speech, say, update, celebrate, progress, pics }: StageProps) {
  const notes = lesson.smartNotes
    .split(/\n+/)
    .map((n) => n.replace(/^\s*[-•*\d.)]+\s*(?=\S)/, "").trim())
    .filter(Boolean);
  const allId = "notes-all";
  const first = lesson.subtopics[0];
  const markRead = () => {
    if (!progress.notesRead) celebrate();
    update((p) => ({ ...p, notesRead: true, stagesDone: { ...p.stagesDone, notes: true } }));
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Storybook banner: AI illustration + Guru */}
      <div className="card relative overflow-hidden">
        <SubtopicPicture pic={pics[first.order]} drawingLabel={tr.drawing} emoji={lesson.subtopics.map((s) => s.emoji).join("")} seed={3} title={lesson.chapterTitle} animate className="h-52 w-full sm:h-56" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 flex flex-wrap items-end gap-3 p-4">
          <GuruOwl size={78} className="anim-floaty hidden shrink-0 sm:block" />
          <div className="min-w-[60%] flex-1 pb-1">
            <p className="text-base font-bold text-sun">📝 {tr.notesTitle}</p>
            <h3 className="text-xl font-extrabold leading-tight text-white sm:text-3xl">{lesson.chapterTitle}</h3>
          </div>
          <SpeakButton
            active={speech.speakingId === allId}
            onClick={() => (speech.speakingId === allId ? speech.stop() : say(allId, notes.join("\n"), { onEnd: markRead }))}
            label={tr.readAll}
            stopLabel={tr.stop}
            className="mb-1"
            small
          />
        </div>
      </div>

      {/* Notebook page with one illustrated card per note */}
      <ol
        className="flex flex-col gap-4 rounded-[2rem] p-3 sm:p-4"
        style={{ background: "repeating-linear-gradient(#fffdf6 0 38px, #e8e3ff 38px 40px)" }}
      >
        {notes.map((n, i) => {
          const id = `note-${i}`;
          const sub = subtopicForNote(n, lesson, i);
          const active = speech.speakingId === id || (speech.speakingId === allId && speech.sentenceIndex === i);
          return (
            <li
              key={i}
              className={`anim-in flex items-center gap-3 rounded-3xl border-l-8 bg-white/95 p-3 text-xl font-semibold leading-snug shadow-sm transition sm:gap-4 sm:text-2xl max-sm:text-lg ${NOTE_COLORS[i % 5]} ${
                active ? "scale-[1.02] shadow-lg ring-4 ring-sun" : ""
              }`}
              style={{ animationDelay: `${i * 0.06}s`, transform: active ? undefined : `rotate(${i % 2 ? 0.4 : -0.4}deg)` }}
            >
              <div className="relative shrink-0">
                <SubtopicPicture pic={pics[sub.order]} emoji={sub.emoji} seed={sub.order} title={sub.title} className="h-16 w-20 rounded-2xl shadow sm:h-24 sm:w-36" />
                <span className={`absolute -left-2 -top-2 grid h-9 w-9 place-items-center rounded-full text-base font-extrabold text-white shadow ${NOTE_DOT[i % 5]}`}>{i + 1}</span>
              </div>
              <Highlight text={n} className="flex-1" />
              <button
                onClick={() => (speech.speakingId === id ? speech.stop() : say(id, n))}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-xl shadow sm:h-12 sm:w-12 sm:text-2xl"
                aria-label={tr.listen}
              >
                {speech.speakingId === id ? "⏹️" : "🔊"}
              </button>
            </li>
          );
        })}
      </ol>

      {lesson.keyWords.length > 0 && (
        <div>
          <h4 className="mb-3 text-2xl font-extrabold">🔤 {tr.keyWords}</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {lesson.keyWords.map((k, i) => (
              <button
                key={i}
                onClick={() => say(`kw-${i}`, `${k.word}. ${k.meaning}`)}
                className="card flex items-center gap-3 p-4 text-left transition hover:-translate-y-1"
              >
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-sun text-3xl">{["🍎", "🌟", "🎈", "🦋", "🌈", "🐣", "🍭", "🚀"][i % 8]}</span>
                <span>
                  <span className="block text-xl font-extrabold">{k.word}</span>
                  <span className="text-lg text-ink/80">{k.meaning}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <button onClick={markRead} className="btn3d bg-leaf py-4 text-2xl text-white">
        {progress.notesRead ? "✅" : "👍"} {tr.finish}
      </button>
    </div>
  );
}
/* --------------------------------- Quiz Time -------------------------------- */
export function QuizStage({ lesson, tr, speech, say, update, celebrate }: StageProps) {
  const qs = lesson.quiz;
  const [i, setI] = useState(0);
  const [picks, setPicks] = useState<(number | null)[]>(() => qs.map(() => null));
  const [showScore, setShowScore] = useState(false);
  const q = qs[i];
  const pick = picks[i];
  const score = picks.reduce<number>((n, p, k) => n + (p !== null && p === qs[k]?.answerIndex ? 1 : 0), 0);
  const answeredCount = picks.filter((p) => p !== null).length;

  if (!qs.length) return <p className="text-xl">—</p>;

  const choose = (o: number) => {
    if (pick !== null) return;
    const next = picks.map((p, k) => (k === i ? o : p));
    setPicks(next);
    const ok = o === q.answerIndex;
    say(`q-fb-${i}`, `${ok ? tr.correct : tr.notQuite} ${ok ? "" : q.answer + "."} ${q.explanation}`);
  };

  const finish = () => {
    speech.stop();
    setShowScore(true);
    if (score / qs.length >= 0.6) celebrate();
    update((p) => ({
      ...p,
      quizAttempts: p.quizAttempts + 1,
      quizBest: Math.max(p.quizBest, score),
      quizTotal: qs.length,
      stagesDone: { ...p.stagesDone, quiz: true },
    }));
  };

  const retry = () => {
    setPicks(qs.map(() => null));
    setI(0);
    setShowScore(false);
  };

  if (showScore) {
    const pct = score / qs.length;
    return (
      <div className="card anim-pop flex flex-col items-center gap-4 p-8 text-center">
        <div className="text-7xl">{pct >= 0.8 ? "🏆" : pct >= 0.5 ? "🥳" : "🌱"}</div>
        <h3 className="text-3xl font-extrabold">{tr.quizDone}</h3>
        <div className="text-6xl font-extrabold text-grape">
          {score} / {qs.length}
        </div>
        <StarRow n={pct >= 0.8 ? 3 : pct >= 0.5 ? 2 : 1} size="text-5xl" />
        <p className="text-2xl font-bold">{pct >= 0.5 ? tr.cheer[score % tr.cheer.length] : tr.motivateSome}</p>
        <div className="flex w-full flex-col gap-2 text-left">
          {qs.map((qq, k) => (
            <div key={k} className={`rounded-2xl px-4 py-2 text-lg font-semibold ${picks[k] === qq.answerIndex ? "bg-leaf/15" : "bg-sun/25"}`}>
              {picks[k] === qq.answerIndex ? "✅" : "💡"} {qq.question} → <b>{qq.answer}</b>
            </div>
          ))}
        </div>
        <button onClick={retry} className="btn3d bg-grape px-8 text-xl text-white">
          🔁 {tr.retry}
        </button>
      </div>
    );
  }

  const LETTERS = ["A", "B", "C", "D"];
  const OPT = ["bg-ocean", "bg-berry", "bg-tang", "bg-leaf"];
  const qid = `q-${i}`;

  return (
    <div className="flex flex-col gap-4">
      {/* question dots for navigation */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {qs.map((qq, k) => (
          <button
            key={k}
            onClick={() => {
              speech.stop();
              setI(k);
            }}
            className={`grid h-11 w-11 place-items-center rounded-full text-lg font-extrabold transition ${
              k === i
                ? "scale-110 bg-grape text-white shadow-lg"
                : picks[k] === null
                  ? "bg-white shadow"
                  : picks[k] === qq.answerIndex
                    ? "bg-leaf text-white"
                    : "bg-sun"
            }`}
            aria-label={`${tr.question} ${k + 1}`}
          >
            {k + 1}
          </button>
        ))}
      </div>

      <div key={i} className="card anim-in flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-base font-extrabold text-grape">
              {tr.question} {i + 1} / {qs.length}
            </span>
            <h3 className="text-3xl font-extrabold leading-snug">{q.question}</h3>
          </div>
          <button
            onClick={() => (speech.speakingId === qid ? speech.stop() : say(qid, `${q.question} ${q.options.map((o, k) => `${LETTERS[k]}. ${o}`).join(". ")}`))}
            className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-sun text-2xl shadow"
            aria-label={tr.listen}
          >
            {speech.speakingId === qid ? "⏹️" : "🔊"}
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {q.options.map((o, k) => {
            const isAns = k === q.answerIndex;
            const isPick = k === pick;
            const state = pick === null ? "idle" : isAns ? "right" : isPick ? "wrong" : "dim";
            return (
              <button
                key={k}
                onClick={() => choose(k)}
                aria-disabled={pick !== null}
                className={`btn3d flex items-center gap-3 px-4 py-4 text-left text-xl ${
                  state === "idle"
                    ? "bg-white ring-4 ring-ink/5 hover:ring-grape/40"
                    : state === "right"
                      ? "anim-pop bg-leaf text-white ring-8 ring-leaf/30"
                      : state === "wrong"
                        ? "anim-shake bg-berry text-white"
                        : "bg-white opacity-50"
                }`}
                style={{ pointerEvents: pick !== null ? "none" : undefined }}
              >
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg font-extrabold text-white ${state === "idle" ? OPT[k] : "bg-white/30"}`}>
                  {state === "right" ? "✓" : state === "wrong" ? "✗" : LETTERS[k]}
                </span>
                {o}
              </button>
            );
          })}
        </div>

        {pick !== null && (
          <div className={`anim-pop rounded-3xl p-4 ${pick === q.answerIndex ? "bg-leaf/15" : "bg-sun/30"}`}>
            <p className="text-2xl font-extrabold">{pick === q.answerIndex ? `🎉 ${tr.correct}` : `🌱 ${tr.notQuite} ${q.answer}`}</p>
            {q.explanation && (
              <p className="mt-1 text-xl font-semibold">
                <b>{tr.explanation}</b> {q.explanation}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => {
              speech.stop();
              setI(i - 1);
            }}
            disabled={i === 0}
            className="btn3d flex-1 bg-white text-xl"
          >
            ← {tr.prev}
          </button>
          {answeredCount === qs.length ? (
            <button onClick={finish} className="btn3d flex-[2] bg-leaf text-xl text-white">
              🏁 {tr.seeScore}
            </button>
          ) : (
            <button
              onClick={() => {
                speech.stop();
                const nextUn = picks.findIndex((p, k) => p === null && k > i);
                setI(nextUn >= 0 ? nextUn : picks.findIndex((p) => p === null));
              }}
              disabled={pick === null}
              className="btn3d flex-[2] bg-grape text-xl text-white"
            >
              {tr.nextQuestion} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ My Achievements ----------------------------- */
export function AchievementsStage({ lesson, tr, progress, onNewChapter }: StageProps & { onNewChapter: () => void }) {
  const stars = totalStars(progress);
  const badges = badgesFor(progress, lesson.subtopics.length);
  const doneCount = LEARNING_STAGES.filter((s) => progress.stagesDone[s]).length;
  const pct = Math.round((doneCount / LEARNING_STAGES.length) * 100);
  const msg = doneCount === 0 ? tr.motivate0 : doneCount === LEARNING_STAGES.length ? tr.motivateAll : tr.motivateSome;
  const stageNames = { watch: tr.stage_watch, explore: tr.stage_explore, notes: tr.stage_notes, quiz: tr.stage_quiz, achievements: tr.stage_achievements };
  const badgeName = { story: tr.badge_story, explorer: tr.badge_explorer, matcher: tr.badge_matcher, reader: tr.badge_reader, quiz: tr.badge_quiz, champion: tr.badge_champion };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card flex flex-col items-center gap-1 bg-gradient-to-br from-sun to-tang p-5 !text-ink">
          <span className="text-5xl">⭐</span>
          <span className="text-5xl font-extrabold">{stars}</span>
          <span className="text-lg font-bold">{tr.totalStars}</span>
        </div>
        <div className="card flex flex-col items-center gap-2 p-5">
          <ProgressRing pct={pct} />
          <span className="text-lg font-bold">
            {doneCount}/{LEARNING_STAGES.length} {tr.stagesDone}
          </span>
        </div>
        <div className="card flex flex-col items-center gap-1 p-5">
          <span className="text-5xl">🎯</span>
          <span className="text-4xl font-extrabold text-grape">{progress.quizTotal ? `${progress.quizBest}/${progress.quizTotal}` : "—"}</span>
          <span className="text-lg font-bold">{tr.bestQuiz}</span>
        </div>
      </div>

      <p className="rounded-3xl bg-grape/10 p-4 text-center text-2xl font-extrabold text-grape">🦉 {msg}</p>

      <div className="card p-5">
        <ul className="grid gap-2 sm:grid-cols-2">
          {LEARNING_STAGES.map((s) => (
            <li key={s} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-xl font-bold ${progress.stagesDone[s] ? "bg-leaf/15" : "bg-ink/5"}`}>
              <span className="text-2xl">{progress.stagesDone[s] ? "✅" : "⬜"}</span> {stageNames[s]}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="mb-3 text-2xl font-extrabold">🏅 {tr.badges}</h4>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {badges.map((b, i) => (
            <div
              key={b.id}
              className={`card anim-in flex flex-col items-center gap-1 p-4 text-center ${b.earned ? "" : "opacity-60"}`}
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <span className={`grid h-20 w-20 place-items-center rounded-full text-5xl ${b.earned ? "anim-floaty bg-gradient-to-br from-sun to-tang shadow-lg" : "bg-ink/10 grayscale"}`}>
                {b.earned ? b.emoji : "🔒"}
              </span>
              <span className="text-lg font-extrabold">{badgeName[b.id]}</span>
              {!b.earned && <span className="text-sm font-semibold text-ink/50">{tr.locked}</span>}
            </div>
          ))}
        </div>
      </div>

      <button onClick={onNewChapter} className="btn3d bg-ocean py-4 text-2xl text-white">
        📚 {tr.newChapter}
      </button>
      <p className="text-center text-sm text-ink/40">{lesson.chapterTitle}</p>
    </div>
  );
}

export function ProgressRing({ pct, size = 96 }: { pct: number; size?: number }) {
  const r = 40;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-label={`${pct}%`}>
      <circle cx="50" cy="50" r={r} stroke="#ece7ff" strokeWidth="12" fill="none" />
      <circle
        cx="50"
        cy="50"
        r={r}
        stroke="url(#ringGrad)"
        strokeWidth="12"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct / 100)}
        transform="rotate(-90 50 50)"
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
      <defs>
        <linearGradient id="ringGrad" x1="0" x2="1">
          <stop offset="0" stopColor="#34c38f" />
          <stop offset="1" stopColor="#7c5cff" />
        </linearGradient>
      </defs>
      <text x="50" y="57" textAnchor="middle" fontSize="22" fontWeight="800" fill="#2b2350">
        {pct}%
      </text>
    </svg>
  );
}
