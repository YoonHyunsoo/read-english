export interface WordbookEntry {
  word: string;
  meaning?: string;
  addedAt: string; // ISO
}

const keyForUser = (email: string) => `wordbook:${email}`;

export function getWordbookEntries(userEmail: string): WordbookEntry[] {
  try {
    const raw = localStorage.getItem(keyForUser(userEmail));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as WordbookEntry[];
  } catch {
    return [];
  }
}

export function isInWordbook(userEmail: string, word: string): boolean {
  return getWordbookEntries(userEmail).some((e) => e.word.toLowerCase() === word.toLowerCase());
}

export function addToWordbook(userEmail: string, entry: { word: string; meaning?: string }): { added: boolean } {
  const list = getWordbookEntries(userEmail);
  const exists = list.some((e) => e.word.toLowerCase() === entry.word.toLowerCase());
  if (exists) return { added: false };
  const next: WordbookEntry[] = [
    { word: entry.word, meaning: entry.meaning, addedAt: new Date().toISOString() },
    ...list,
  ];
  localStorage.setItem(keyForUser(userEmail), JSON.stringify(next));
  return { added: true };
}

// --- Daily studied tracking (KST day) ---
const getKstDateString = (): string => {
  const now = new Date();
  const kstMs = now.getTime() + 9 * 60 * 60 * 1000; // UTC+9
  const kst = new Date(kstMs);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const d = String(kst.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const studiedKey = (email: string, ymd = getKstDateString()) => `wordbook:studied:${email}:${ymd}`;

export function getStudiedTodayWords(userEmail: string): string[] {
  try {
    const raw = localStorage.getItem(studiedKey(userEmail));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as string[] : [];
  } catch {
    return [];
  }
}

export function addStudiedTodayWords(userEmail: string, words: string[]): void {
  const prev = new Set(getStudiedTodayWords(userEmail).map(w => w.toLowerCase()));
  words.forEach(w => prev.add(w.toLowerCase()));
  localStorage.setItem(studiedKey(userEmail), JSON.stringify(Array.from(prev)));
}


