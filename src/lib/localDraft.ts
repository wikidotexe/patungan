/**
 * localDraft — typed localStorage helper for offline-first data persistence.
 * Data is always written here first; Supabase is a best-effort cloud sync.
 */

const PREFIX = "patungan_draft_";

export const localDraft = {
    set<T>(key: string, data: T): void {
        try {
            localStorage.setItem(PREFIX + key, JSON.stringify(data));
        } catch {
            // Ignore storage quota errors
        }
    },

    get<T>(key: string): T | null {
        try {
            const raw = localStorage.getItem(PREFIX + key);
            return raw ? (JSON.parse(raw) as T) : null;
        } catch {
            return null;
        }
    },

    remove(key: string): void {
        localStorage.removeItem(PREFIX + key);
    },
};
