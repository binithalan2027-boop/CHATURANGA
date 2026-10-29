export interface FeedbackSubmission {
  id: string;
  category: 'modes' | 'working' | 'not_working' | 'all';
  rating: 'great' | 'good' | 'okay' | 'needs_work' | null;
  newModesWanted: string;
  whatIsWorking: string;
  whatIsNotWorking: string;
  selectedTags: string[];
  contactName?: string;
  contactEmail?: string;
  playerId?: string;
  createdAt: string;
  userAgent?: string;
  screenWidth?: number;
}

const STORAGE_KEY = 'chaturanga_player_feedback_v1';
const memoryStorage: Record<string, string> = {};

function getStorageItem(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch {}
  return memoryStorage[key] ?? null;
}

function setStorageItem(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  } catch {}
  memoryStorage[key] = value;
}

function removeStorageItem(key: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  } catch {}
  delete memoryStorage[key];
}

export function getFeedbackList(): FeedbackSubmission[] {
  try {
    const raw = getStorageItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to read feedback from storage:', e);
    return [];
  }
}

export function submitFeedback(
  data: Omit<FeedbackSubmission, 'id' | 'createdAt' | 'userAgent' | 'screenWidth'>
): FeedbackSubmission {
  const newSubmission: FeedbackSubmission = {
    ...data,
    id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js/Test',
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : 1280,
  };

  try {
    const existing = getFeedbackList();
    const updated = [newSubmission, ...existing].slice(0, 100); // keep last 100
    setStorageItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to store feedback:', e);
  }

  return newSubmission;
}

export function clearFeedbackList(): void {
  removeStorageItem(STORAGE_KEY);
}

export function exportFeedbackJson(): string {
  const list = getFeedbackList();
  return JSON.stringify(list, null, 2);
}
