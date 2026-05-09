// Format: kazdy cytat to linia/akapit zaczynajacy sie od `> "tekst" — Autor`

export interface Quote {
  text: string;
  author: string;
}

const QUOTE_REGEX = /^>\s*["„](.+?)["”]\s*[—\-–]\s*(.+?)\s*$/;

export function parseQuotes(markdown: string): Quote[] {
  const lines = markdown.split(/\n+/);
  const quotes: Quote[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    const m = QUOTE_REGEX.exec(trimmed);
    if (m) {
      quotes.push({ text: m[1].trim(), author: m[2].trim() });
    }
  }
  return quotes;
}

/**
 * Wybiera cytat dnia — deterministyczny per dayOfYear (caly dzien ten sam cytat).
 * Zmiana o pólnocy logicznej (3:00 AM zalatwione przez getLogicalDateString w callsite).
 */
export function quoteOfTheDay(quotes: Quote[], dateStr: string): Quote | null {
  if (quotes.length === 0) return null;
  // dateStr = YYYY-MM-DD
  const d = new Date(dateStr + "T12:00:00");
  const start = new Date(d.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((d.getTime() - start.getTime()) / 86400000);
  return quotes[dayOfYear % quotes.length];
}
