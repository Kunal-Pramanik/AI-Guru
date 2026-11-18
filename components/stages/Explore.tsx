"use client";

import { useEffect, useMemo, useState } from "react";
import { SpeakButton, StarRow, SubtopicPicture } from "@/components/ui";
import { addUnique, shuffle, type StageProps } from "./shared";

type View = "menu" | "discover" | "match" | "challenge";

export function ExploreStage(props: StageProps) {
  const { tr, progress } = props;
  const [view, setView] = useState<View>("menu");
  const back = () => {
    props.speech.stop();
    setView("menu");
  };

  if (view === "discover") return <Discover {...props} onBack={back} />;
  if (view === "match") return <MatchGame {...props} onBack={back} />;
  if (view === "challenge") return <QuickChallenge {...props} onBack={back} />;

  const tiles: { id: View; icon: string; title: string; sub: string; color: string; done: boolean }[] = [
    { id: "discover", icon: "🔍", title: tr.discover, sub: tr.discoverSub, color: "from-ocean to-[#62c4ff]", done: progress.discovered.length >= props.lesson.subtopics.length },
    { id: "match", icon: "🧩", title: tr.match, sub: tr.matchSub, color: "from-berry to-[#ff8fb1]", done: progress.matchStars > 0 },
    { id: "challenge", icon: "⚡", title: tr.challenge, sub: tr.challengeSub, color: "from-tang to-sun", done: progress.challengeBest > 0 },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {tiles.map((t, i) => (
        <button
          key={t.id}
          onClick={() => setView(t.id)}
          className={`btn3d anim-in relative flex flex-col items-center gap-2 bg-gradient-to-br ${t.color} p-6 text-white`}
          style={{ animationDelay: `${i * 0.08}s` }}
        >
          {t.done && <span className="absolute right-3 top-3 rounded-full bg-white px-2 py-0.5 text-sm text-leaf">✅ {tr.done}</span>}
          <span className="anim-floaty text-7xl" style={{ animationDelay: `${i * 0.3}s` }}>
            {t.icon}
          </span>
          <span className="text-2xl">{t.title}</span>
          <span className="text-base font-semibold opacity-90">{t.sub}</span>
        </button>
      ))}
    </div>
  );
}

function BackBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="w-fit rounded-full bg-white px-4 py-2 text-lg font-bold shadow">
      ← {label}
    </button>
  );
}

/* ----------------------------- Discover & Learn ----------------------------- */
function Discover({ lesson, tr, pics, speech, say, update, onBack }: StageProps & { onBack: () => void }) {
  const [i, setI] = useState(0);
  const s = lesson.subtopics[i];
  const id = `disc-${s.order}`;

  const open = (n: number) => {
    speech.stop();
    setI(n);
    update((p) => ({ ...p, discovered: addUnique(p.discovered, lesson.subtopics[n].order) }));
  };
  // first part counts as discovered when opened
  const firstOrder = lesson.subtopics[0]?.order;
  useEffect(() => {
    if (firstOrder) update((p) => (p.discovered.includes(firstOrder) ? p : { ...p, discovered: addUnique(p.discovered, firstOrder) }));
  }, [firstOrder, update]);

  return (
    <div className="flex flex-col gap-4">
      <BackBtn onClick={onBack} label={tr.back} />
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {lesson.subtopics.map((st, n) => (
          <button
            key={st.order}
            onClick={() => open(n)}
            className={`flex min-h-[52px] shrink-0 items-center gap-2 rounded-full px-4 text-lg font-extrabold transition ${n === i ? "bg-ocean text-white shadow-lg" : "bg-white shadow"}`}
          >
            <span>{st.emoji.slice(0, 2)}</span> {tr.part} {st.order}
          </button>
        ))}
      </div>

      <div key={s.order} className="card anim-in overflow-hidden">
        <SubtopicPicture pic={pics[s.order]} drawingLabel={tr.drawing} emoji={s.emoji} seed={i} title={s.title} animate className="aspect-video w-full" />
        <div className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-3xl font-extrabold">{s.title}</h3>
            <SpeakButton
              active={speech.speakingId === id}
              onClick={() => (speech.speakingId === id ? speech.stop() : say(id, `${s.title}. ${s.explanation} ${s.keyPoints.join(". ")}`))}
              label={tr.listen}
              stopLabel={tr.stop}
            />
          </div>
          <p className="text-2xl leading-relaxed">{s.explanation}</p>
          {s.keyPoints.length > 0 && (
            <div className="rounded-3xl bg-sun/25 p-4">
              <h4 className="mb-2 text-xl font-extrabold">💡 {tr.keyPoints}</h4>
              <ul className="flex flex-col gap-2">
                {s.keyPoints.map((k, n) => (
                  <li key={n} className="flex items-start gap-3 text-xl font-semibold">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-tang text-base font-extrabold text-white">{n + 1}</span>
                    {k}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {s.sourceContent && (
            <details className="rounded-3xl bg-sky p-4 text-lg">
              <summary className="cursor-pointer font-extrabold">📘 {tr.whatBookSays}</summary>
              <p className="mt-2">{s.sourceContent}</p>
            </details>
          )}
          <div className="flex justify-between gap-3">
            <button onClick={() => open(i - 1)} disabled={i === 0} className="btn3d flex-1 bg-white text-xl">
              ← {tr.prev}
            </button>
            {i < lesson.subtopics.length - 1 ? (
              <button onClick={() => open(i + 1)} className="btn3d flex-[2] bg-ocean text-xl text-white">
                {tr.nextScene} →
              </button>
            ) : (
              <button onClick={onBack} className="btn3d flex-[2] bg-leaf text-xl text-white">
                ✅ {tr.finish}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Match & Learn ------------------------------ */
function MatchGame({ lesson, tr, update, celebrate, say, onBack }: StageProps & { onBack: () => void }) {
  const pairs = lesson.matchPairs;
  const [round, setRound] = useState(0);
  const rights = useMemo(() => shuffle(pairs.map((_, i) => i)), [pairs, round]); // eslint-disable-line react-hooks/exhaustive-deps
  const lefts = useMemo(() => shuffle(pairs.map((_, i) => i)), [pairs, round]); // eslint-disable-line react-hooks/exhaustive-deps
  const [selected, setSelected] = useState<number | null>(null);
  const [matched, setMatched] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const done = matched.length === pairs.length && pairs.length > 0;
  const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;

  const tapRight = (ri: number) => {
    if (selected === null || matched.includes(ri)) return;
    if (selected === ri) {
      const m = [...matched, ri];
      setMatched(m);
      setSelected(null);
      setMsg({ ok: true, text: tr.matchRight });
      say(`match-${ri}`, `${pairs[ri].left}. ${pairs[ri].right}`);
      if (m.length === pairs.length) {
        celebrate();
        const s = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
        update((p) => {
          const matchStars = Math.max(p.matchStars, s);
          return { ...p, matchStars, stagesDone: { ...p.stagesDone, explore: p.stagesDone.explore || p.challengeBest > 0 } };
        });
      }
    } else {
      setWrong(ri);
      setMistakes((n) => n + 1);
      setMsg({ ok: false, text: tr.matchWrong });
      setTimeout(() => setWrong(null), 500);
    }
  };

  const replay = () => {
    setRound((r) => r + 1);
    setMatched([]);
    setSelected(null);
    setMistakes(0);
    setMsg(null);
  };

  const COLORS = ["bg-ocean", "bg-berry", "bg-leaf", "bg-tang"];

  return (
    <div className="flex flex-col gap-4">
      <BackBtn onClick={onBack} label={tr.back} />
      <p className="rounded-3xl bg-white p-4 text-center text-xl font-bold shadow">👆 {tr.matchHelp}</p>

      {done ? (
        <div className="card anim-pop flex flex-col items-center gap-4 p-8 text-center">
          <div className="text-7xl">🎉</div>
          <h3 className="text-3xl font-extrabold">{tr.allMatched}</h3>
          <StarRow n={stars} size="text-5xl" />
          <div className="flex w-full flex-col gap-2">
            {pairs.map((p, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl bg-leaf/10 px-4 py-3 text-left text-lg font-bold">
                <span className="text-2xl">{p.emoji}</span> {p.left} <span className="text-leaf">⟷</span> {p.right}
              </div>
            ))}
          </div>
          <button onClick={replay} className="btn3d bg-berry px-8 text-xl text-white">
            🔁 {tr.playAgain}
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-5">
            <div className="flex flex-col gap-3">
              {lefts.map((li) => {
                const isMatched = matched.includes(li);
                return (
                  <button
                    key={li}
                    onClick={() => !isMatched && setSelected(li)}
                    className={`btn3d flex min-h-[84px] items-center gap-2 px-3 py-3 text-left text-lg leading-tight text-white sm:text-xl ${COLORS[li % 4]} ${
                      isMatched ? "!bg-leaf opacity-60" : selected === li ? "scale-105 ring-8 ring-sun" : ""
                    }`}
                    aria-pressed={selected === li}
                  >
                    <span className="text-3xl">{isMatched ? "✅" : pairs[li].emoji}</span>
                    <span>{pairs[li].left}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-col gap-3">
              {rights.map((ri) => {
                const isMatched = matched.includes(ri);
                return (
                  <button
                    key={ri}
                    onClick={() => tapRight(ri)}
                    className={`btn3d min-h-[84px] border-4 px-3 py-3 text-left text-lg leading-tight sm:text-xl ${
                      isMatched ? "border-leaf bg-leaf/15 text-leaf" : "border-grape/20 bg-white"
                    } ${wrong === ri ? "anim-shake !border-berry !bg-berry/10" : ""} ${selected !== null && !isMatched ? "hover:border-grape" : ""}`}
                  >
                    {isMatched && "✅ "}
                    {pairs[ri].right}
                  </button>
                );
              })}
            </div>
          </div>
          {msg && (
            <p key={msg.text + matched.length + mistakes} className={`anim-pop text-center text-2xl font-extrabold ${msg.ok ? "text-leaf" : "text-berry"}`}>
              {msg.ok ? "🎉 " : "🤔 "}
              {msg.text}
            </p>
          )}
        </>
      )}
    </div>
  );
}

/* ------------------------------ Quick Challenge ----------------------------- */
function QuickChallenge({ lesson, tr, update, celebrate, say, speech, onBack }: StageProps & { onBack: () => void }) {
  const items = lesson.challenges;
  const [i, setI] = useState(0);
  const [answered, setAnswered] = useState<null | { ok: boolean }>(null);
  const [flipped, setFlipped] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const c = items[i];

  const record = (ok: boolean) => {
    setAnswered({ ok });
    if (ok) setScore((s) => s + 1);
  };

  const next = () => {
    speech.stop();
    if (i < items.length - 1) {
      setI(i + 1);
      setAnswered(null);
      setFlipped(false);
    } else {
      setFinished(true);
      celebrate();
      update((p) => ({
        ...p,
        challengeBest: Math.max(p.challengeBest, score, 1),
        stagesDone: { ...p.stagesDone, explore: p.stagesDone.explore || p.matchStars > 0 },
      }));
    }
  };

  const replay = () => {
    setI(0);
    setScore(0);
    setAnswered(null);
    setFlipped(false);
    setFinished(false);
  };

  if (!c) return <BackBtn onClick={onBack} label={tr.back} />;

  if (finished)
    return (
      <div className="flex flex-col gap-4">
        <BackBtn onClick={onBack} label={tr.back} />
        <div className="card anim-pop flex flex-col items-center gap-4 p-8 text-center">
          <div className="text-7xl">🏅</div>
          <h3 className="text-3xl font-extrabold">{tr.yourScore}</h3>
          <div className="text-6xl font-extrabold text-grape">
            {score} / {items.length}
          </div>
          <StarRow n={score} max={items.length} size="text-5xl" />
          <p className="text-2xl font-bold">{tr.cheer[score % tr.cheer.length]}</p>
          <button onClick={replay} className="btn3d bg-tang px-8 text-xl text-white">
            🔁 {tr.playAgain}
          </button>
        </div>
      </div>
    );

  const sid = `ch-${i}`;
  return (
    <div className="flex flex-col gap-4">
      <BackBtn onClick={onBack} label={tr.back} />
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-white px-4 py-2 text-lg font-extrabold shadow">
          ⚡ {tr.challengeOf} {i + 1} {tr.of} {items.length}
        </span>
        <span className="text-2xl font-extrabold">⭐ {score}</span>
      </div>

      {c.type === "flashcard" ? (
        <div key={i} className="flex flex-col gap-4">
          <button className="flip h-72 w-full" onClick={() => !flipped && setFlipped(true)} aria-label={tr.tapToFlip}>
            <div className={`flip-inner h-full ${flipped ? "flipped" : ""}`}>
              <div className="flip-face card flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-grape to-ocean p-6 !text-white">
                <span className="text-5xl">❓</span>
                <span className="text-3xl font-extrabold leading-snug">{c.prompt}</span>
                <span className="anim-wiggle mt-2 rounded-full bg-white/25 px-4 py-1 text-lg font-bold">👆 {tr.tapToFlip}</span>
              </div>
              <div className="flip-face flip-back card flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-leaf to-[#7fe0b6] p-6 !text-white">
                <span className="text-5xl">💡</span>
                <span className="text-3xl font-extrabold leading-snug">{c.answer}</span>
                {c.explanation && <span className="text-xl font-semibold opacity-95">{c.explanation}</span>}
              </div>
            </div>
          </button>
          <div className="flex justify-center">
            <SpeakButton
              small
              active={speech.speakingId === sid}
              onClick={() => (speech.speakingId === sid ? speech.stop() : say(sid, flipped ? `${c.answer}. ${c.explanation}` : c.prompt))}
              label={tr.listen}
              stopLabel={tr.stop}
            />
          </div>
          {flipped && !answered && (
            <div className="anim-in grid grid-cols-2 gap-3">
              <button onClick={() => record(true)} className="btn3d bg-leaf text-xl text-white">
                😄 {tr.iKnewIt}
              </button>
              <button onClick={() => record(false)} className="btn3d bg-sun text-xl text-ink">
                💪 {tr.stillLearning}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div key={i} className="card anim-in flex flex-col items-center gap-5 p-6 text-center">
          <span className="text-5xl">🤔</span>
          <p className="text-3xl font-extrabold leading-snug">{c.prompt}</p>
          <SpeakButton
            small
            active={speech.speakingId === sid}
            onClick={() => (speech.speakingId === sid ? speech.stop() : say(sid, c.prompt))}
            label={tr.listen}
            stopLabel={tr.stop}
          />
          <div className="grid w-full grid-cols-2 gap-4">
            <button
              style={{ pointerEvents: answered ? "none" : undefined, opacity: answered && !c.isTrue ? 0.45 : 1 }}
              onClick={() => record(c.isTrue)}
              className={`btn3d flex flex-col items-center py-5 text-2xl text-white ${answered && c.isTrue ? "bg-leaf ring-8 ring-leaf/30" : "bg-leaf/90"}`}
            >
              <span className="text-5xl">👍</span>
              {tr.trueBtn}
            </button>
            <button
              style={{ pointerEvents: answered ? "none" : undefined, opacity: answered && c.isTrue ? 0.45 : 1 }}
              onClick={() => record(!c.isTrue)}
              className={`btn3d flex flex-col items-center py-5 text-2xl text-white ${answered && !c.isTrue ? "bg-berry ring-8 ring-berry/30" : "bg-berry/90"}`}
            >
              <span className="text-5xl">👎</span>
              {tr.falseBtn}
            </button>
          </div>
        </div>
      )}

      {answered && (
        <div className={`anim-pop rounded-3xl p-5 text-center ${answered.ok ? "bg-leaf/15" : "bg-sun/30"}`}>
          <p className="text-2xl font-extrabold">{answered.ok ? `🎉 ${tr.correct}` : `🌱 ${tr.notQuite}`}</p>
          {c.type === "truefalse" && (
            <p className="mt-2 text-xl font-semibold">
              {c.answer} {c.explanation && `— ${c.explanation}`}
            </p>
          )}
          <button onClick={next} className="btn3d mt-4 bg-grape px-8 text-xl text-white">
            {i < items.length - 1 ? `${tr.nextQuestion} →` : `🏁 ${tr.seeScore}`}
          </button>
        </div>
      )}
    </div>
  );
}
