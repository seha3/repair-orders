import { loadAppState, saveAppState } from "./localStorageRepo";
import { createSeedState } from "../mocks/seedData";
import type { AppState } from "./appState.types";

export function ensureAppState(): AppState {
  const existing = loadAppState();
  if (existing) return existing;

  const seed = createSeedState();
  saveAppState(seed);
  return seed;
}
