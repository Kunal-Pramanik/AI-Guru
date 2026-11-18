"use client";

import { useEffect, useRef, useState } from "react";
import type { Lesson } from "./types";

export type PicState = { status: "loading" } | { status: "ready"; url: string } | { status: "failed" };

const KEY = "aiGuruImages";
const RETRY_WAIT_MS = 45_000; // wait before trying failed pictures again
const MAX_ROUNDS = 12; // ~10 minutes of retrying while Google is busy

/**
 * Asks the server to draw one illustration per subtopic, one at a time (gentle on free-tier limits).
 * If Google is busy (503/429), failed pictures are retried every 45 s instead of giving up.
 * Results are cached on the server's disk and in sessionStorage, so revisits are instant.
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
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    (async () => {
      const urls = { ...saved };
      for (let round = 1; round <= MAX_ROUNDS && !cancelled; round++) {
        const todo = lesson.subtopics.filter((s) => !urls[s.order]);
        if (todo.length === 0) return;

        for (const s of todo) {
          if (cancelled) return;
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
          } catch (e) {
            console.warn(`[pictures] part ${s.order} not drawn yet (round ${round}):`, (e as Error).message);
            // keep showing "Guru is drawing…" – we will try again
          }
        }

        if (lesson.subtopics.every((s) => urls[s.order])) return;
        await sleep(RETRY_WAIT_MS);
      }
      // after ~10 minutes, stop the badge on pictures that still failed (scene art stays)
      if (!cancelled) {
        setPics((p) => {
          const next = { ...p };
          for (const s of lesson.subtopics) if (!urls[s.order]) next[s.order] = { status: "failed" };
          return next;
        });
      }
    })();

    return () => {
      cancelled = true;
      started.current = null;
    };
  }, [lesson]);

  return pics;
}