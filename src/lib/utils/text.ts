/**
 * Append hashtag do końca textarea/input value (z separatorem space).
 * Używane przez TagPicker callbacks w 8 miejscach (check-in, check-out, plan/tydzien w obu wariantach + TaskStatusPopup, QuickCapture).
 */
export function appendTag(current: string, hashtag: string): string {
  if (!current.trim()) return hashtag;
  if (current.endsWith(" ")) return current + hashtag;
  return current + " " + hashtag;
}
