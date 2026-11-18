"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LANG_LABELS } from "./i18n";
import type { Lang } from "./types";

/**
 * Text-to-speech with the browser Web Speech API.
 * - picks the best voice for en-IN / hi-IN / gu-IN
 * - splits long text into sentences (Chrome stops long utterances)
 * - one narration at a time (no overlap), reports the sentence being read
 */
export function splitSentences(text: string): string[] {
  return text
    .replace(/\*\*/g, "")
    .split(/(?<=[.!?।॥])\s+|\n+/u)
    .map((s) => s.trim())
    .filter(Boolean);
}

function pickVoice(voices: SpeechSynthesisVoice[], lang: Lang): SpeechSynthesisVoice | null {
  for (const code of LANG_LABELS[lang].speech) {
    const c = code.toLowerCase();
    const matches = voices.filter((v) => v.lang.toLowerCase().replace("_", "-").startsWith(c));
    if (matches.length) {
      // Prefer natural/Google/online voices, which usually sound better.
      return matches.find((v) => /google|natural|online/i.test(v.name)) || matches[0];
    }
  }
  return null;
}

export function useSpeech(lang: Lang) {
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [sentenceIndex, setSentenceIndex] = useState(-1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [supported, setSupported] = useState(true);
  const runRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time capability check
      setSupported(false);
      return;
    }
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", load);
      window.speechSynthesis.cancel();
    };
  }, []);

  const stop = useCallback(() => {
    runRef.current++;
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeakingId(null);
    setSentenceIndex(-1);
  }, []);

  const hasVoice = !!pickVoice(voices, lang);

  /** Speak text. Returns false if no voice exists for this language. */
  const speak = useCallback(
    (id: string, text: string, opts?: { onEnd?: () => void; startAt?: number; rate?: number }) => {
      if (!supported) return false;
      const synth = window.speechSynthesis;
      synth.cancel();
      const run = ++runRef.current;
      const voice = pickVoice(synth.getVoices(), lang);
      const sentences = splitSentences(text);
      let i = opts?.startAt ?? 0;
      setSpeakingId(id);

      const next = () => {
        if (run !== runRef.current) return;
        if (i >= sentences.length) {
          setSpeakingId(null);
          setSentenceIndex(-1);
          opts?.onEnd?.();
          return;
        }
        const u = new SpeechSynthesisUtterance(sentences[i]);
        u.lang = voice?.lang || LANG_LABELS[lang].speech[0];
        if (voice) u.voice = voice;
        u.rate = opts?.rate ?? 0.88; // a little slower for young children
        u.pitch = 1.1;
        setSentenceIndex(i);
        u.onend = () => {
          i++;
          next();
        };
        u.onerror = (e) => {
          if (e.error === "interrupted" || e.error === "canceled") return;
          i++;
          next();
        };
        synth.speak(u);
      };
      next();
      return !!voice;
    },
    [lang, supported],
  );

  return { speak, stop, speakingId, sentenceIndex, hasVoice, supported, voicesLoaded: voices.length > 0 };
}
