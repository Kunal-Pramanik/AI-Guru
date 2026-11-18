import { NextResponse } from "next/server";
import { toFriendly } from "@/lib/gemini";
import { findCached, generateIllustration, type IllustrationRequest } from "@/lib/illustrator";

export const runtime = "nodejs";
export const maxDuration = 180;

// Avoid drawing the same picture twice at the same time (e.g. React re-renders / two tabs).
const inflight = new Map<string, Promise<{ id: string; kind: "png" | "svg" }>>();

export async function POST(req: Request) {
  try {
    const b = (await req.json()) as Partial<IllustrationRequest>;
    const r: IllustrationRequest = {
      title: String(b.title || "").slice(0, 120),
      description: String(b.description || b.title || "").slice(0, 600),
      chapter: String(b.chapter || "").slice(0, 120),
      seed: Number(b.seed) || 0,
    };
    if (!r.description) return NextResponse.json({ error: "Nothing to draw." }, { status: 400 });

    const cached = await findCached(r);
    if (cached) return NextResponse.json({ url: `/api/illustration/${cached.id}.${cached.kind}`, kind: cached.kind, cached: true });

    const key = `${r.chapter}|${r.title}|${r.description}`;
    let job = inflight.get(key);
    if (!job) {
      job = generateIllustration(r).finally(() => inflight.delete(key));
      inflight.set(key, job);
    }
    const out = await job;
    return NextResponse.json({ url: `/api/illustration/${out.id}.${out.kind}`, kind: out.kind, cached: false });
  } catch (err) {
    const fe = toFriendly(err);
    console.error("[illustrate]", fe.code, (err as Error)?.message);
    return NextResponse.json({ error: fe.message, code: fe.code }, { status: fe.status });
  }
}
