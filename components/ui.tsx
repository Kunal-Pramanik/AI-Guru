"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { firstEmoji } from "@/lib/lesson";
import { LANG_LABELS } from "@/lib/i18n";
import { LANGS, type Lang } from "@/lib/types";
import type { PicState } from "@/lib/useIllustrations";

/* ---------------- Guru the owl (original mascot, pure SVG) ---------------- */
export function GuruOwl({ size = 120, className = "", mood = "happy" }: { size?: number; className?: string; mood?: "happy" | "wow" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" className={className} aria-hidden>
      <ellipse cx="100" cy="186" rx="52" ry="8" fill="#2b2350" opacity="0.12" />
      {/* ear tufts */}
      <path d="M48 58 L40 22 L74 46 Z" fill="#6a4cf0" />
      <path d="M152 58 L160 22 L126 46 Z" fill="#6a4cf0" />
      {/* body */}
      <ellipse cx="100" cy="112" rx="64" ry="72" fill="#7c5cff" />
      <ellipse cx="100" cy="132" rx="40" ry="46" fill="#c9b8ff" />
      {/* belly feathers */}
      <path d="M80 120 q10 8 20 0 q10 8 20 0" stroke="#a48cff" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M80 140 q10 8 20 0 q10 8 20 0" stroke="#a48cff" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* wings */}
      <ellipse cx="40" cy="118" rx="14" ry="34" fill="#6a4cf0" transform="rotate(14 40 118)" />
      <ellipse cx="160" cy="118" rx="14" ry="34" fill="#6a4cf0" transform="rotate(-14 160 118)" />
      {/* eyes */}
      <circle cx="74" cy="78" r="26" fill="white" />
      <circle cx="126" cy="78" r="26" fill="white" />
      <circle cx={mood === "wow" ? 74 : 78} cy="80" r={mood === "wow" ? 14 : 12} fill="#2b2350" />
      <circle cx={mood === "wow" ? 126 : 122} cy="80" r={mood === "wow" ? 14 : 12} fill="#2b2350" />
      <circle cx="82" cy="74" r="4" fill="white" />
      <circle cx="126" cy="74" r="4" fill="white" />
      {/* beak */}
      <path d="M92 98 L108 98 L100 112 Z" fill="#ffc93c" />
      {/* cheeks */}
      <circle cx="58" cy="102" r="7" fill="#ff8fb1" opacity="0.7" />
      <circle cx="142" cy="102" r="7" fill="#ff8fb1" opacity="0.7" />
      {/* feet */}
      <path d="M80 182 l-6 6 M80 182 l0 7 M80 182 l6 6" stroke="#ff8a3d" strokeWidth="5" strokeLinecap="round" />
      <path d="M120 182 l-6 6 M120 182 l0 7 M120 182 l6 6" stroke="#ff8a3d" strokeWidth="5" strokeLinecap="round" />
      {/* tiny book */}
      <rect x="84" y="150" width="32" height="22" rx="3" fill="#ffc93c" />
      <line x1="100" y1="150" x2="100" y2="172" stroke="#e0a800" strokeWidth="3" />
    </svg>
  );
}

/* ---------------- Speech bubble ---------------- */
export function Bubble({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative rounded-3xl bg-white px-5 py-3 text-lg font-bold shadow-lg ${className}`}>
      {children}
      <span className="absolute -left-2 top-6 h-5 w-5 rotate-45 bg-white" />
    </div>
  );
}

/* ---------------- Confetti ---------------- */
export function Confetti({ show }: { show: boolean }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        left: (i * 37) % 100,
        delay: ((i * 13) % 20) / 10,
        dur: 2.4 + ((i * 7) % 15) / 10,
        color: ["#ffc93c", "#ff5c8a", "#34c38f", "#2fa8ff", "#7c5cff", "#ff8a3d"][i % 6],
        size: 8 + (i % 4) * 3,
        round: i % 3 === 0,
      })),
    [],
  );
  if (!show) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[80] overflow-hidden" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 1.6,
            background: p.color,
            borderRadius: p.round ? "999px" : "3px",
            animation: `confetti ${p.dur}s ${p.delay}s linear both`,
          }}
          className="absolute top-0"
        />
      ))}
    </div>
  );
}

/* ---------------- Modal / full screen sheet ---------------- */
export function Sheet({
  open,
  onClose,
  title,
  color = "#7c5cff",
  icon,
  children,
  closeLabel,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  color?: string;
  icon?: string;
  children: ReactNode;
  closeLabel: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="anim-in flex max-h-[100dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[2rem] bg-[#fffdf8] shadow-2xl sm:max-h-[94dvh] sm:rounded-[2rem]">
        <div className="flex items-center gap-3 px-5 py-4 text-white" style={{ background: color }}>
          {icon && <span className="text-3xl">{icon}</span>}
          <h2 className="flex-1 text-2xl font-extrabold leading-tight">{title}</h2>
          <button onClick={onClose} className="btn3d grid h-14 w-14 place-items-center bg-white/25 text-3xl text-white" aria-label={closeLabel}>
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

/* ---------------- Listen button ---------------- */
export function SpeakButton({
  active,
  onClick,
  label,
  stopLabel,
  className = "",
  small = false,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  stopLabel: string;
  className?: string;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`btn3d inline-flex items-center gap-2 ${small ? "min-h-[48px] px-4 text-base" : "px-5 text-lg"} ${
        active ? "bg-berry text-white" : "bg-sun text-ink"
      } ${className}`}
      aria-pressed={active}
    >
      <span className={`text-2xl ${active ? "anim-wiggle" : ""}`}>{active ? "⏹️" : "🔊"}</span>
      {active ? stopLabel : label}
    </button>
  );
}

/* ---------------- Language pills ---------------- */
export function LangSwitch({ value, onChange, busy }: { value: Lang; onChange: (l: Lang) => void; busy?: boolean }) {
  return (
    <div className="flex gap-1 rounded-full bg-white/80 p-1 shadow-inner" role="radiogroup">
      {LANGS.map((l) => (
        <button
          key={l}
          role="radio"
          aria-checked={value === l}
          disabled={busy}
          onClick={() => onChange(l)}
          className={`min-h-[44px] rounded-full px-3 text-base font-extrabold transition sm:px-4 ${
            value === l ? "bg-grape text-white shadow" : "text-ink/70 hover:bg-grape/10"
          }`}
        >
          {LANG_LABELS[l].native}
        </button>
      ))}
    </div>
  );
}

/* ---------------- Stars ---------------- */
export function StarRow({ n, max = 3, size = "text-3xl" }: { n: number; max?: number; size?: string }) {
  return (
    <div className={`flex gap-1 ${size}`} aria-label={`${n} / ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < n ? "anim-pop" : "opacity-25 grayscale"} style={{ animationDelay: `${i * 0.15}s` }}>
          ⭐
        </span>
      ))}
    </div>
  );
}

/* ---------------- Scene art (fallback illustration, no API cost) ---------------- */
const PALETTES = [
  ["#8fd3ff", "#e3f6ff", "#7ed957", "#4cb944"],
  ["#ffd6a5", "#fff1dc", "#9be15d", "#6cc04a"],
  ["#c3b5ff", "#f1ecff", "#7fdbb6", "#3fbf8f"],
  ["#ffb3c7", "#ffeef3", "#a8e063", "#79c143"],
  ["#9fe7f5", "#effcff", "#ffd36e", "#f2b632"],
];

function emojis(s: string): string[] {
  const m = s.match(/\p{Extended_Pictographic}(️|‍\p{Extended_Pictographic})*/gu);
  return m && m.length ? m.slice(0, 3) : [firstEmoji(s)];
}

export function SceneArt({ emoji, seed = 0, title, className = "" }: { emoji: string; seed?: number; title?: string; className?: string }) {
  const [sky, sky2, hill, hill2] = PALETTES[seed % PALETTES.length];
  const list = emojis(emoji);
  return (
    <div className={`overflow-hidden ${className || "relative"}`} style={{ background: `linear-gradient(180deg, ${sky} 0%, ${sky2} 70%)`, containerType: "size" }} role="img" aria-label={title}>
      {/* sun */}
      <div className="absolute right-[10%] top-[10%] h-[18%] w-auto aspect-square rounded-full bg-[#ffe066] shadow-[0_0_40px_10px_#fff3b0]" />
      {/* clouds */}
      {[0, 1].map((i) => (
        <div key={i} className="absolute" style={{ top: `${12 + i * 14}%`, left: 0, width: "100%", animation: `drift ${28 + i * 12}s linear ${-i * 9}s infinite` }}>
          <div className="relative h-8 w-24 rounded-full bg-white/90">
            <div className="absolute -top-4 left-4 h-10 w-10 rounded-full bg-white/90" />
            <div className="absolute -top-6 left-10 h-12 w-12 rounded-full bg-white/90" />
          </div>
        </div>
      ))}
      {/* hills */}
      <div className="absolute -bottom-[30%] -left-[10%] h-[65%] w-[70%] rounded-[50%]" style={{ background: hill }} />
      <div className="absolute -bottom-[35%] -right-[10%] h-[70%] w-[75%] rounded-[50%]" style={{ background: hill2 }} />
      {/* characters */}
      <div className="absolute inset-x-0 bottom-[12%] flex items-end justify-center gap-[4%]">
        {list.map((e, i) => (
          <span
            key={i}
            className="anim-floaty drop-shadow-[0_8px_6px_rgba(0,0,0,0.25)]"
            style={{ fontSize: i === 1 || list.length === 1 ? "min(42cqh, 7rem)" : "min(30cqh, 5rem)", animationDelay: `${i * 0.4}s` }}
          >
            {e}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Picture for a subtopic: AI-generated illustration when ready, otherwise animated scene art. */
export function SubtopicPicture({
  pic,
  emoji,
  seed,
  title,
  className = "",
  animate = false,
  drawingLabel,
}: {
  pic?: PicState;
  emoji: string;
  seed: number;
  title: string;
  className?: string;
  animate?: boolean;
  drawingLabel?: string;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const url = pic?.status === "ready" && pic.url !== failedUrl ? pic.url : null;
  const focus = [
    ["-3%", "-2%"],
    ["3%", "-3%"],
    ["-2%", "3%"],
  ][seed % 3];
  return (
    <div className={`relative overflow-hidden bg-sky ${className}`}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={url}
          src={url}
          alt={title}
          onError={() => setFailedUrl(url)}
          className={`anim-in absolute inset-0 h-full w-full object-cover ${animate ? "anim-kenburns" : ""}`}
          style={{ ["--kx" as string]: focus[0], ["--ky" as string]: focus[1] }}
        />
      ) : (
        <SceneArt emoji={emoji} seed={seed} title={title} className="absolute inset-0" />
      )}
      {pic?.status === "loading" && drawingLabel && (
        <span className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-sm font-extrabold text-grape shadow">
          <span className="anim-wiggle inline-block">🖌️</span> {drawingLabel}
        </span>
      )}
    </div>
  );
}

/** Render text with **bold** highlights. */
export function Highlight({ text, className = "" }: { text: string; className?: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span className={className}>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <mark key={i} className="rounded-lg bg-sun/60 px-1 font-extrabold text-ink">
            {p.slice(2, -2)}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </span>
  );
}

export function Toast({ msg, onDone }: { msg: string | null; onDone: () => void }) {
  useEffect(() => {
    if (!msg) return;
    const id = setTimeout(onDone, 4500);
    return () => clearTimeout(id);
  }, [msg, onDone]);
  if (!msg) return null;
  return (
    <div className="anim-in fixed bottom-5 left-1/2 z-[90] w-[92%] max-w-md -translate-x-1/2 rounded-3xl bg-ink px-5 py-4 text-center text-lg font-bold text-white shadow-2xl" role="status">
      {msg}
    </div>
  );
}
