"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { splitSentences } from "@/lib/useSpeech";
import { SubtopicPicture } from "@/components/ui";
import { addUnique, type StageProps } from "./shared";

interface Scene {
  key: string;
  order: number; // 0 = whole chapter
  title: string;
  text: string;
}

export function WatchStage(props: StageProps) {
  const { lesson, tr, progress, pics } = props;
  const [scene, setScene] = useState<Scene | null>(null);

  const chapterScene: Scene = { key: "chapter", order: 0, title: tr.chapterStory, text: lesson.storyLesson };

  if (scene) return <StoryPlayer {...props} scene={scene} onBack={() => setScene(null)} />;

  return (
    <div className="flex flex-col gap-5">
      {/* Whole chapter story */}
      <button
        onClick={() => setScene(chapterScene)}
        className="card group relative flex flex-col overflow-hidden text-left sm:flex-row"
      >
        <SubtopicPicture
          pic={pics[lesson.subtopics[0]?.order]}
          drawingLabel={tr.drawing}
          emoji={lesson.subtopics.map((s) => s.emoji).join("")}
          seed={4}
          title={lesson.chapterTitle}
          className="aspect-video w-full sm:w-1/2"
        />
        <div className="flex flex-1 flex-col justify-center gap-2 p-5">
          <span className="w-fit rounded-full bg-berry px-3 py-1 text-sm font-extrabold text-white">🎬 {tr.chapterStory}</span>
          <h3 className="text-2xl font-extrabold">{lesson.chapterTitle}</h3>
          <p className="line-clamp-3 text-lg text-ink/70">{lesson.overview}</p>
          <span className="btn3d mt-2 inline-flex w-fit items-center gap-2 bg-grape px-5 py-3 text-xl text-white">
            ▶️ {tr.playStory} {progress.storiesWatched.includes(0) && "✅"}
          </span>
        </div>
      </button>

      {/* Subtopic stories */}
      <div className="grid gap-4 sm:grid-cols-2">
        {lesson.subtopics.map((s, i) => (
          <button
            key={s.order}
            onClick={() => setScene({ key: `sub-${s.order}`, order: s.order, title: s.title, text: s.storyScript })}
            className="card anim-in flex flex-col overflow-hidden text-left transition hover:-translate-y-1"
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <div className="relative">
              <SubtopicPicture pic={pics[s.order]} drawingLabel={tr.drawing} emoji={s.emoji} seed={i} title={s.title} className="aspect-[16/10] w-full" />
              <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-base font-extrabold shadow">
                {tr.part} {s.order}
              </span>
              {progress.storiesWatched.includes(s.order) && (
                <span className="absolute right-3 top-3 rounded-full bg-leaf px-3 py-1 text-base font-extrabold text-white shadow">⭐ {tr.done}</span>
              )}
              <span className="absolute bottom-3 right-3 grid h-14 w-14 place-items-center rounded-full bg-white/95 text-2xl shadow-lg">▶️</span>
            </div>
            <div className="p-4">
              <h4 className="text-xl font-extrabold">{s.title}</h4>
              <p className="line-clamp-2 text-base text-ink/60">{s.explanation}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Storybook player: picture with slow camera motion + the story told sentence by sentence,
 * read aloud by Guru. Works like a short narrated "video" without any video generation cost.
 */
function StoryPlayer({ lesson, tr, pics, speech, update, say, celebrate, scene, onBack }: StageProps & { scene: Scene; onBack: () => void }) {
  const sentences = useMemo(() => splitSentences(scene.text), [scene.text]);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const id = `story-${scene.key}`;
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishedRef = useRef(false);
  // Follow the narrator's current sentence while Guru is reading.
  const speakingThis = speech.speakingId === id;
  const cur = speakingThis && speech.sentenceIndex >= 0 ? speech.sentenceIndex : idx;

  // Which picture to show: for the whole-chapter story, move through subtopic pictures in order.
  const n = lesson.subtopics.length;
  const subIndex = scene.order === 0 ? Math.min(n - 1, Math.floor((cur * n) / Math.max(1, sentences.length))) : scene.order - 1;
  const sub = lesson.subtopics[subIndex];

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setPlaying(false);
    setFinished(true);
    celebrate();
    update((p) => {
      const storiesWatched = addUnique(p.storiesWatched, scene.order);
      const allSubs = lesson.subtopics.every((s) => storiesWatched.includes(s.order));
      return { ...p, storiesWatched, stagesDone: { ...p.stagesDone, watch: p.stagesDone.watch || storiesWatched.includes(0) || allSubs } };
    });
  };


  // Without a voice for this language, auto-advance like a slideshow.
  useEffect(() => {
    if (!playing || speech.hasVoice) return;
    timer.current = setInterval(() => {
      setIdx((i) => {
        if (i >= sentences.length - 1) {
          finish();
          return i;
        }
        return i + 1;
      });
    }, 3800);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, speech.hasVoice, sentences.length]);

  const stopSpeech = speech.stop;
  useEffect(() => () => stopSpeech(), [stopSpeech]);

  const play = (from = cur) => {
    setFinished(false);
    finishedRef.current = false;
    setPlaying(true);
    if (speech.hasVoice) say(id, scene.text, { startAt: from, onEnd: finish });
    else say(id, "", {}); // shows "no voice" message once
  };
  const pause = () => {
    setIdx(cur);
    setPlaying(false);
    speech.stop();
  };
  const go = (d: number) => {
    const next = Math.max(0, Math.min(sentences.length - 1, cur + d));
    setIdx(next);
    if (playing && speech.hasVoice) say(id, scene.text, { startAt: next, onEnd: finish });
    if (!playing && next === sentences.length - 1 && d > 0) finish();
  };

  return (
    <div className="flex flex-col gap-4">
      <button onClick={onBack} className="w-fit rounded-full bg-white px-4 py-2 text-lg font-bold shadow">
        ← {tr.back}
      </button>
      <div className="card overflow-hidden">
        <div className="relative">
          <SubtopicPicture
            key={sub.order}
            pic={pics[sub.order]}
            drawingLabel={tr.drawing}
            emoji={sub.emoji}
            seed={subIndex}
            title={sub.title}
            animate
            className="aspect-video w-full"
          />
          <div className="absolute left-3 top-3 rounded-full bg-white/95 px-4 py-1 text-lg font-extrabold shadow">{scene.title}</div>
          {/* progress bar */}
          <div className="absolute inset-x-0 bottom-0 h-2 bg-black/20">
            <div className="h-full bg-sun transition-all duration-500" style={{ width: `${((cur + 1) / sentences.length) * 100}%` }} />
          </div>
          {finished && (
            <div className="anim-pop absolute inset-0 grid place-items-center bg-ink/40">
              <div className="rounded-3xl bg-white px-8 py-6 text-center text-3xl font-extrabold shadow-2xl">{tr.storyDone}</div>
            </div>
          )}
        </div>

        {/* Caption: current sentence big, like subtitles */}
        <div className="flex min-h-[9rem] flex-col items-center justify-center gap-2 px-5 py-5 text-center">
          <p key={cur} className="anim-in text-2xl font-bold leading-snug sm:text-3xl">
            {sentences[cur]}
          </p>
          <p className="text-base font-bold text-ink/40">
            {cur + 1} / {sentences.length}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 border-t-2 border-ink/5 p-4">
          <button onClick={() => go(-1)} disabled={cur === 0} className="btn3d h-16 w-16 bg-sky text-3xl" aria-label={tr.prev}>
            ⏮️
          </button>
          <button
            onClick={() => (playing ? pause() : play(finished ? 0 : cur))}
            className={`btn3d h-20 min-w-[10rem] px-6 text-2xl text-white ${playing ? "bg-berry" : "bg-leaf"}`}
          >
            {playing ? `⏸️ ${tr.stop}` : `▶️ ${tr.playStory}`}
          </button>
          <button onClick={() => go(1)} disabled={cur >= sentences.length - 1 && finished} className="btn3d h-16 w-16 bg-sky text-3xl" aria-label={tr.nextScene}>
            ⏭️
          </button>
        </div>
      </div>

      {/* Full text for reading along */}
      <details className="card p-5 text-lg">
        <summary className="cursor-pointer text-xl font-extrabold">📖 {scene.title}</summary>
        <div className="mt-3 flex flex-col gap-1">
          {sentences.map((s, i) => (
            <button key={i} onClick={() => setIdx(i)} className={`rounded-xl px-2 py-1 text-left ${i === cur ? "bg-sun/50 font-extrabold" : ""}`}>
              {s}
            </button>
          ))}
        </div>
      </details>
    </div>
  );
}
