const USER_KEY = "patungan_user";

export interface AppUser {
    username: string;
    email: string;
}

export function getStoredUser(): AppUser | null {
    try {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? (JSON.parse(raw) as AppUser) : null;
    } catch {
        return null;
    }
}

export function storeUser(user: AppUser): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredUser(): void {
    localStorage.removeItem(USER_KEY);
}
