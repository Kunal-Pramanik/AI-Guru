"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bubble, GuruOwl, LangSwitch, Toast } from "@/components/ui";
import { DEMO_BOOK_ID, DEMO_LESSONS } from "@/lib/demoLesson";
import { LANG_LABELS, t } from "@/lib/i18n";
import { LANGS, STORAGE_KEYS, type Lang, type Lesson, type Student } from "@/lib/types";

const MAX_FILES = 8;
const MAX_SIZE = 15 * 1024 * 1024;
// Total upload limit. On Vercel set NEXT_PUBLIC_MAX_TOTAL_MB=4 (Vercel rejects requests over 4.5 MB).
const MAX_TOTAL_MB = Number(process.env.NEXT_PUBLIC_MAX_TOTAL_MB) || 120;
const AVATARS = ["🐯", "🐼", "🦊", "🐰", "🐸", "🦁", "🐨", "🐵"];
const PREFS: Student["preference"][] = ["stories", "pictures", "games", "listening"];
const PREF_ICON: Record<Student["preference"], string> = { stories: "📖", pictures: "🖼️", games: "🎲", listening: "🎧" };

interface Picked {
  id: string;
  file: File;
  url: string | null; // preview for images
}

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [student, setStudent] = useState<Student>({ name: "", classLevel: 1, language: "en", preference: "stories", avatar: "🐯" });
  const [files, setFiles] = useState<Picked[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const tr = t(student.language);

  // Returning student: restore profile and jump to upload.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.studentSaved);
      if (saved) {
        const s = JSON.parse(saved) as Student;
        if (s?.name) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from storage once
          setStudent(s);
          setStep(4);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!busy) return;
    const id = setInterval(() => setLoadStep((s) => (s + 1) % tr.makingSteps.length), 2600);
    return () => clearInterval(id);
  }, [busy, tr.makingSteps.length]);

  const addFiles = useCallback(
    (list: FileList | File[] | null) => {
      if (!list) return;
      const incoming = Array.from(list);
      setFiles((prev) => {
        const next = [...prev];
        for (const f of incoming) {
          if (next.length >= MAX_FILES) {
            setToast(tr.tooMany);
            break;
          }
          const isPdf = f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
          const isImg = f.type.startsWith("image/");
          if (!isPdf && !isImg) {
            setToast(tr.badType);
            continue;
          }
          if (f.size > MAX_SIZE) {
            setToast(`${tr.tooBig} ${f.name}`);
            continue;
          }
          const total = next.reduce((n, p) => n + p.file.size, 0) + f.size;
          if (total > MAX_TOTAL_MB * 1024 * 1024) {
            setToast(`${tr.tooBig} ${f.name} (max ${MAX_TOTAL_MB} MB)`);
            continue;
          }
          next.push({ id: `${f.name}-${f.size}-${Math.random()}`, file: f, url: isImg ? URL.createObjectURL(f) : null });
        }
        return next;
      });
    },
    [tr],
  );

  const removeFile = (id: string) =>
    setFiles((prev) => {
      const f = prev.find((p) => p.id === id);
      if (f?.url) URL.revokeObjectURL(f.url);
      return prev.filter((p) => p.id !== id);
    });

  const saveStudent = (s: Student) => {
    sessionStorage.setItem(STORAGE_KEYS.student, JSON.stringify(s));
    try {
      localStorage.setItem(STORAGE_KEYS.studentSaved, JSON.stringify(s));
    } catch {
      /* ignore */
    }
  };

  const openLessons = (lesson: Lesson, bookId: string | null, isDemo: boolean) => {
    // clear old translation cache for the previous chapter
    for (const l of LANGS) sessionStorage.removeItem(STORAGE_KEYS.translationPrefix + l);
    sessionStorage.setItem(STORAGE_KEYS.lessons, JSON.stringify(lesson));
    sessionStorage.setItem(STORAGE_KEYS.chapterName, lesson.chapterTitle);
    sessionStorage.setItem(STORAGE_KEYS.bookId, bookId ?? "");
    sessionStorage.setItem(STORAGE_KEYS.isDemo, isDemo ? "1" : "");
    saveStudent(student);
    router.push("/learn");
  };

  const startDemo = () => {
    // Pre-fill translation cache with the reviewed demo translations (no API calls needed).
    openLessons(DEMO_LESSONS[student.language], DEMO_BOOK_ID, true);
    for (const l of LANGS) sessionStorage.setItem(STORAGE_KEYS.translationPrefix + l, JSON.stringify(DEMO_LESSONS[l]));
  };

  const makeLessons = async () => {
    if (!files.length) return;
    setBusy(true);
    setError(null);
    setLoadStep(0);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f.file, f.file.name));
      fd.append("classLevel", String(student.classLevel));
      fd.append("language", student.language);
      fd.append("preference", student.preference);
      fd.append("name", student.name);
      const res = await fetch("/api/prepare-lessons", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.lesson) throw new Error(data.error || "Something went wrong. Please try again.");
      openLessons(data.lesson as Lesson, data.bookId ?? null, false);
    } catch (e) {
      setError((e as Error).message === "Failed to fetch" ? "No internet connection. Please check and try again." : (e as Error).message);
      setBusy(false);
    }
  };

  const setLang = (language: Lang) => setStudent((s) => ({ ...s, language }));
  const canNext = step !== 1 || student.name.trim().length > 0;

  /* ---------------------------- Loading screen ---------------------------- */
  if (busy) {
    return (
      <main className="grid min-h-dvh place-items-center p-6 text-center">
        <div className="anim-in flex flex-col items-center gap-6">
          <div className="relative">
            <GuruOwl size={180} className="anim-floaty" mood="wow" />
            <span className="anim-wiggle absolute -right-6 top-4 text-5xl">📖</span>
          </div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">{tr.making}</h1>
          <p key={loadStep} className="anim-in text-2xl font-bold text-grape">
            {tr.makingSteps[loadStep]}
          </p>
          <div className="h-5 w-72 overflow-hidden rounded-full bg-white shadow-inner">
            <div className="h-full rounded-full bg-gradient-to-r from-leaf via-sun to-berry transition-all duration-[2500ms]" style={{ width: `${Math.min(95, 18 + loadStep * 19)}%` }} />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 pb-10 pt-4 sm:px-6">
      {/* Header */}
      <header className="flex items-center justify-between gap-3 py-2">
        <div className="flex items-center gap-2">
          <GuruOwl size={52} />
          <div>
            <div className="whitespace-nowrap text-2xl font-extrabold leading-none text-grape">{tr.appName}</div>
            <div className="hidden text-sm font-semibold text-ink/60 sm:block">{tr.tagline}</div>
          </div>
        </div>
        {step > 0 && <LangSwitch value={student.language} onChange={setLang} />}
      </header>

      {/* Progress dots */}
      {step < 4 && (
        <div className="my-4 flex justify-center gap-2" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`h-3 rounded-full transition-all ${i === step ? "w-10 bg-grape" : i < step ? "w-3 bg-leaf" : "w-3 bg-ink/15"}`} />
          ))}
        </div>
      )}

      <section key={step} className="anim-in flex-1">
        {/* STEP 0: language */}
        {step === 0 && (
          <div className="flex flex-col items-center gap-6 pt-4 text-center">
            <div className="flex items-end gap-3">
              <GuruOwl size={150} className="anim-floaty" />
              <Bubble className="mb-16 max-w-[220px] text-left">
                Namaste! 🙏
                <br />
                नमस्ते! · નમસ્તે!
              </Bubble>
            </div>
            <h1 className="text-3xl font-extrabold sm:text-4xl">
              Choose your language
              <span className="mt-1 block text-2xl text-ink/70">अपनी भाषा चुनो · તમારી ભાષા પસંદ કરો</span>
            </h1>
            <div className="grid w-full gap-4 sm:grid-cols-3">
              {LANGS.map((l, i) => (
                <button
                  key={l}
                  onClick={() => {
                    setLang(l);
                    setStep(1);
                  }}
                  className={`btn3d flex flex-col items-center gap-1 py-6 text-white ${["bg-ocean", "bg-tang", "bg-leaf"][i]}`}
                >
                  <span className="text-5xl font-extrabold">{LANG_LABELS[l].flag}</span>
                  <span className="text-3xl">{LANG_LABELS[l].native}</span>
                  <span className="text-base font-semibold opacity-90">{LANG_LABELS[l].english}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 1: name + avatar */}
        {step === 1 && (
          <div className="card flex flex-col gap-6 p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <GuruOwl size={90} />
              <div>
                <p className="text-xl font-bold text-ink/70">{tr.hello}</p>
                <h2 className="text-3xl font-extrabold">{tr.whatsYourName}</h2>
              </div>
            </div>
            <input
              autoFocus
              value={student.name}
              maxLength={30}
              onChange={(e) => setStudent((s) => ({ ...s, name: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && canNext && setStep(2)}
              placeholder={tr.namePlaceholder}
              className="w-full rounded-3xl border-4 border-grape/30 bg-sky px-6 py-4 text-3xl font-bold outline-none focus:border-grape"
              aria-label={tr.whatsYourName}
            />
            <div>
              <h3 className="mb-3 text-2xl font-extrabold">{tr.pickAvatar}</h3>
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setStudent((s) => ({ ...s, avatar: a }))}
                    className={`grid aspect-square place-items-center rounded-3xl text-4xl transition ${
                      student.avatar === a ? "scale-110 bg-sun shadow-lg ring-4 ring-tang" : "bg-sky hover:bg-sun/40"
                    }`}
                    aria-pressed={student.avatar === a}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: class */}
        {step === 2 && (
          <div className="card flex flex-col gap-6 p-6 sm:p-8">
            <h2 className="text-3xl font-extrabold">
              {student.avatar} {tr.whichClass}
            </h2>
            <div className="grid grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map((c, i) => (
                <button
                  key={c}
                  onClick={() => setStudent((s) => ({ ...s, classLevel: c }))}
                  className={`btn3d flex flex-col items-center py-4 text-white ${["bg-berry", "bg-tang", "bg-sun !text-ink", "bg-leaf", "bg-ocean"][i]} ${
                    student.classLevel === c ? "scale-110 ring-4 ring-grape" : "opacity-80"
                  }`}
                  aria-pressed={student.classLevel === c}
                >
                  <span className="text-sm font-bold">{tr.classN}</span>
                  <span className="text-4xl">{c}</span>
                </button>
              ))}
            </div>
            <h2 className="pt-2 text-3xl font-extrabold">{tr.howYouLike}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PREFS.map((p) => (
                <button
                  key={p}
                  onClick={() => setStudent((s) => ({ ...s, preference: p }))}
                  className={`btn3d flex flex-col items-center gap-1 py-4 ${student.preference === p ? "bg-grape text-white" : "bg-sky text-ink"}`}
                  aria-pressed={student.preference === p}
                >
                  <span className="text-4xl">{PREF_ICON[p]}</span>
                  <span className="text-xl">{tr[`pref_${p}`]}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: ready */}
        {step === 3 && (
          <div className="flex flex-col items-center gap-6 pt-6 text-center">
            <div className="text-8xl anim-pop">{student.avatar}</div>
            <h2 className="text-4xl font-extrabold">
              {tr.hi}, {student.name}! 🎉
            </h2>
            <p className="text-2xl font-bold text-ink/70">{tr.helloSub}</p>
            <GuruOwl size={130} className="anim-floaty" />
          </div>
        )}

        {/* STEP 4: upload */}
        {step === 4 && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <span className="text-5xl">{student.avatar}</span>
              <div className="flex-1">
                <p className="text-xl font-bold text-ink/70">
                  {tr.hi}, {student.name}! · {tr.classN} {student.classLevel}
                </p>
                <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">{tr.uploadTitle} 📚</h1>
              </div>
              <button onClick={() => setStep(1)} className="rounded-full bg-white px-4 py-2 text-xl shadow" aria-label="Edit profile">
                ✏️
              </button>
            </div>

            <div
              className="card border-4 border-dashed border-grape/30 p-5 sm:p-6"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                addFiles(e.dataTransfer.files);
              }}
            >
              <p className="mb-4 text-center text-xl font-bold text-ink/70">{tr.uploadSub}</p>
              <div className="grid grid-cols-3 gap-3">
                <PickButton icon="📄" label={tr.addPdf} color="bg-berry" accept="application/pdf" onFiles={addFiles} />
                <PickButton icon="🖼️" label={tr.addPhotos} color="bg-ocean" accept="image/*" multiple onFiles={addFiles} />
                <button onClick={() => setCameraOpen(true)} className="btn3d flex flex-col items-center gap-1 bg-leaf py-4 text-white">
                  <span className="text-4xl">📷</span>
                  <span className="text-lg">{tr.useCamera}</span>
                </button>
              </div>
              <p className="mt-3 text-center text-sm font-semibold text-ink/50">{MAX_TOTAL_MB < 15 ? `PDF / 📷 · max ${MAX_TOTAL_MB} MB` : tr.filesLimit}</p>
              {files.length > 0 && (
                <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {files.map((f, i) => (
                    <li key={f.id} className="anim-pop relative overflow-hidden rounded-2xl bg-sky shadow">
                      {f.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={f.url} alt={f.file.name} className="aspect-[3/4] w-full object-cover" />
                      ) : (
                        <div className="grid aspect-[3/4] place-items-center bg-berry/10 text-6xl">📄</div>
                      )}
                      <div className="truncate px-2 py-1 text-xs font-bold">
                        {i + 1}. {f.file.name}
                      </div>
                      <button
                        onClick={() => removeFile(f.id)}
                        className="absolute right-1 top-1 grid h-11 w-11 place-items-center rounded-full bg-white/95 text-xl shadow"
                        aria-label={`${tr.remove} ${f.file.name}`}
                      >
                        🗑️
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {error && (
              <div className="anim-shake flex items-center gap-3 rounded-3xl bg-berry/10 p-4 text-lg font-bold text-berry" role="alert">
                <span className="text-4xl">🙈</span>
                <span className="flex-1">
                  {tr.oops} {error}
                </span>
              </div>
            )}

            <button onClick={makeLessons} disabled={!files.length} className="btn3d bg-grape py-5 text-2xl text-white">
              ✨ {error ? tr.tryAgain : tr.makeLessons}
            </button>

            <div className="mt-2 flex flex-col items-center gap-2 rounded-3xl bg-white/70 p-4 text-center">
              <p className="text-lg font-bold text-ink/70">{tr.orTryDemo}</p>
              <button onClick={startDemo} className="btn3d bg-sun px-6 text-xl text-ink">
                🐒 {tr.tryDemo}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Footer nav for onboarding */}
      {step > 0 && step < 4 && (
        <nav className="sticky bottom-0 mt-6 flex gap-3 bg-gradient-to-t from-[#f5f0ff] pb-2 pt-4">
          <button onClick={() => setStep((s) => s - 1)} className="btn3d flex-1 bg-white text-xl">
            ← {tr.back}
          </button>
          <button
            onClick={() => {
              if (step === 3) saveStudent(student);
              setStep((s) => s + 1);
            }}
            disabled={!canNext}
            className="btn3d flex-[2] bg-leaf text-2xl text-white"
          >
            {step === 3 ? tr.letsGo : tr.next} →
          </button>
        </nav>
      )}

      {cameraOpen && (
        <CameraModal
          labels={{ take: tr.takePhoto, close: tr.close, error: tr.cameraError }}
          onClose={() => setCameraOpen(false)}
          onPhoto={(f) => addFiles([f])}
          fallback={(fl) => addFiles(fl)}
        />
      )}
      <Toast msg={toast} onDone={() => setToast(null)} />
    </main>
  );
}

function PickButton({
  icon,
  label,
  color,
  accept,
  multiple,
  onFiles,
}: {
  icon: string;
  label: string;
  color: string;
  accept: string;
  multiple?: boolean;
  onFiles: (f: FileList | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button onClick={() => ref.current?.click()} className={`btn3d flex flex-col items-center gap-1 py-4 text-white ${color}`}>
        <span className="text-4xl">{icon}</span>
        <span className="text-lg">{label}</span>
      </button>
      <input
        ref={ref}
        type="file"
        hidden
        accept={accept}
        multiple={multiple ?? true}
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </>
  );
}

/** Live camera (laptop/phone) with snapshot; falls back to the phone's camera picker. */
function CameraModal({
  onClose,
  onPhoto,
  fallback,
  labels,
}: {
  onClose: () => void;
  onPhoto: (f: File) => void;
  fallback: (f: FileList | null) => void;
  labels: { take: string; close: string; error: string };
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [failed, setFailed] = useState(false);
  const [flash, setFlash] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let stream: MediaStream | null = null;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1920 } }, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        setFailed(true);
      }
    })();
    return () => stream?.getTracks().forEach((tr) => tr.stop());
  }, []);

  const snap = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0);
    c.toBlob(
      (b) => {
        if (!b) return;
        onPhoto(new File([b], `camera-page-${Date.now()}.jpg`, { type: "image/jpeg" }));
        setFlash(true);
        setCount((n) => n + 1);
        setTimeout(() => setFlash(false), 200);
      },
      "image/jpeg",
      0.9,
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex h-[100dvh] flex-col bg-black">
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {!failed ? (
          <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full object-contain" />
        ) : (
          <div className="grid h-full place-items-center p-6 text-center text-2xl font-bold text-white">
            <div className="flex flex-col items-center gap-4">
              <span className="text-6xl">📷</span>
              {labels.error}
              <button onClick={() => inputRef.current?.click()} className="btn3d bg-leaf px-6 text-white">
                📷 {labels.take}
              </button>
              <input ref={inputRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => fallback(e.target.files)} />
            </div>
          </div>
        )}
        {flash && <div className="absolute inset-0 bg-white/80" />}
        {count > 0 && <div className="absolute left-4 top-4 rounded-full bg-leaf px-4 py-2 text-xl font-extrabold text-white">✅ {count}</div>}
      </div>
      <div className="flex shrink-0 items-center justify-center gap-6 bg-black/90 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <button onClick={onClose} className="btn3d bg-white px-6 text-xl text-ink">
          ✕ {labels.close}
        </button>
        {!failed && (
          <button onClick={snap} className="btn3d grid h-20 w-20 place-items-center rounded-full bg-berry text-4xl text-white" aria-label={labels.take}>
            📸
          </button>
        )}
      </div>
    </div>
  );
}
