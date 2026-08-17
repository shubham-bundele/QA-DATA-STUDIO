const PREFIX = "qds_";

export type ThemeSetting = "light" | "dark" | "system";

interface StorageKeys {
  theme: ThemeSetting;
  locale: string;
  recent_gen: string;
  onboarding: "complete" | "pending";
}

function getKey(key: keyof StorageKeys): string {
  return PREFIX + key;
}

export function getSetting<K extends keyof StorageKeys>(key: K): StorageKeys[K] | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(getKey(key));
  return value as StorageKeys[K] | null;
}

export function setSetting<K extends keyof StorageKeys>(key: K, value: StorageKeys[K]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getKey(key), value);
}

export function removeSetting(key: keyof StorageKeys): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getKey(key));
}

export function clearAllSettings(): void {
  if (typeof window === "undefined") return;
  const keys = Object.keys(localStorage);
  for (const key of keys) {
    if (key.startsWith(PREFIX)) {
      localStorage.removeItem(key);
    }
  }
}
