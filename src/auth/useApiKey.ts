import { useEffect, useState } from "react";

const STORAGE_KEY = "fly-eye:apiKey";
const KEY_CHANGED_EVENT = "fly-eye:apiKeyChanged";

// VITE_FLYWHEEL_API_KEY is bundled at build/dev time. Useful for local dev
// where keeping the key in .env beats pasting on every fresh browser profile.
const ENV_KEY = import.meta.env.VITE_FLYWHEEL_API_KEY as string | undefined;

export function getApiKey(): string | null {
  return localStorage.getItem(STORAGE_KEY) ?? ENV_KEY ?? null;
}

export function setApiKey(key: string): void {
  localStorage.setItem(STORAGE_KEY, key);
  window.dispatchEvent(new Event(KEY_CHANGED_EVENT));
}

export function clearApiKey(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(KEY_CHANGED_EVENT));
}

export function useApiKey(): string | null {
  const [key, setKey] = useState<string | null>(() => getApiKey());

  useEffect(() => {
    const sync = () => setKey(getApiKey());
    window.addEventListener(KEY_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(KEY_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return key;
}
