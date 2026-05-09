import { fetchRecentEntries } from "@/lib/supabase/entries";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { BoldV1AuditW22Client } from "./AuditW22Client";

interface PageProps {
  searchParams?: Promise<{ days?: string }>;
}

export default async function BoldV1AuditW22Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const daysBack = Math.max(7, Math.min(60, Number(params?.days ?? 28) || 28));
  const entries = await fetchRecentEntries(["checkin", "checkout"], daysBack);

  const reviews: { date: string; criticScore: number | null }[] = [];
  try {
    const dir = join(process.cwd(), "docs", "przegladci");
    const { readdir } = await import("node:fs/promises");
    const files = await readdir(dir);
    const mdFiles = files.filter((f) => f.endsWith(".md")).sort().reverse().slice(0, 6);
    for (const f of mdFiles) {
      try {
        const content = await readFile(join(dir, f), "utf-8");
        const m = content.match(/Critic Score[^\d]*(\d)\s*\/\s*5/i);
        const score = m ? Number(m[1]) : null;
        const dateMatch = f.match(/^(\d{4}-\d{2}-\d{2})/);
        reviews.push({ date: dateMatch ? dateMatch[1] : f, criticScore: score });
      } catch {
        // skip unreadable file
      }
    }
  } catch {
    // brak folderu = brak reviews
  }

  return <BoldV1AuditW22Client entries={entries} daysBack={daysBack} reviews={reviews} />;
}
