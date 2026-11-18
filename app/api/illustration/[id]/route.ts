import { readFile } from "node:fs/promises";
import path from "node:path";
import { CACHE_DIR } from "@/lib/illustrator";

export const runtime = "nodejs";

// Serves cached AI illustrations from .ai-guru-cache/illustrations
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const m = id.match(/^([a-f0-9]{20})\.(png|svg)$/);
  if (!m) return new Response("Not found", { status: 404 });
  try {
    const data = await readFile(path.join(CACHE_DIR, id));
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": m[2] === "png" ? "image/png" : "image/svg+xml",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
