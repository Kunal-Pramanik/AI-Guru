import "server-only";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// Small JSON cache on disk (.ai-guru-cache/<bucket>/<key>.json).
// Same textbook + same settings → same lesson, with zero API requests.

// On Vercel only /tmp is writable (temporary, per server instance). Locally we keep a real folder.
const ROOT = process.env.VERCEL ? "/tmp/ai-guru-cache" : path.join(process.cwd(), ".ai-guru-cache");

export const hashOf = (...parts: (string | Buffer)[]) => {
  const h = createHash("sha256");
  for (const p of parts) h.update(p).update("|");
  return h.digest("hex").slice(0, 24);
};

export async function readJson<T>(bucket: string, key: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(path.join(ROOT, bucket, `${key}.json`), "utf8")) as T;
  } catch {
    return null;
  }
}

export async function writeJson(bucket: string, key: string, value: unknown) {
  try {
    await mkdir(path.join(ROOT, bucket), { recursive: true });
    await writeFile(path.join(ROOT, bucket, `${key}.json`), JSON.stringify(value), "utf8");
  } catch (e) {
    console.warn("[cache] could not save", bucket, (e as Error).message);
  }
}
