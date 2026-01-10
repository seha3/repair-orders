import { STORAGE_KEYS } from "./storage.keys";
import type { AppState } from "./appState.types";

export function loadAppState(): AppState | null {
  const raw = localStorage.getItem(STORAGE_KEYS.APP_STATE);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AppState;
  } catch {
    return null;
  }
}

export function saveAppState(state: AppState) {
  localStorage.setItem(STORAGE_KEYS.APP_STATE, JSON.stringify(state));
}
