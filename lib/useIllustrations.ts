"use client";

import { useEffect, useRef, useState } from "react";
import type { Lesson } from "./types";

export type PicState = { status: "loading" } | { status: "ready"; url: string } | { status: "failed" };

const KEY = "aiGuruImages";

/**
 * Asks the server to draw one illustration per subtopic, one at a time (gentle on free-tier limits).
 * Results are cached on the server's disk and in sessionStorage, so revisits are instant.
 * Uses the ORIGINAL lesson so pictures stay the same when the language changes.
 */
export function useIllustrations(lesson: Lesson | null) {
  const [pics, setPics] = useState<Record<number, PicState>>({});
  const started = useRef<string | null>(null);

  useEffect(() => {
    if (!lesson) return;
    const id = lesson.chapterTitle;
    if (started.current === id) return;
    started.current = id;

    let saved: Record<number, string> = {};
    try {
      const raw = JSON.parse(sessionStorage.getItem(KEY) || "{}");
      if (raw.chapter === id) saved = raw.urls || {};
    } catch {
      /* ignore */
    }
    const initial: Record<number, PicState> = {};
    for (const s of lesson.subtopics) initial[s.order] = saved[s.order] ? { status: "ready", url: saved[s.order] } : { status: "loading" };
    setPics(initial);

    let cancelled = false;
    (async () => {
      const urls = { ...saved };
      for (const s of lesson.subtopics) {
        if (cancelled) return;
        if (urls[s.order]) continue;
        try {
          const res = await fetch("/api/illustrate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: s.title, description: s.visualDescription || s.title, chapter: lesson.chapterTitle, seed: s.order }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.url) throw new Error(data.error || "failed");
          urls[s.order] = data.url;
          sessionStorage.setItem(KEY, JSON.stringify({ chapter: id, urls }));
          if (!cancelled) setPics((p) => ({ ...p, [s.order]: { status: "ready", url: data.url } }));
        } catch {
          if (!cancelled) setPics((p) => ({ ...p, [s.order]: { status: "failed" } }));
        }
      }
    })();
    return () => {
      cancelled = true;
      started.current = null;
    };
  }, [lesson]);

  return pics;
}
