// Per-space credential store (localStorage). Editor mode needs a real delivery
// token — the URL's `_storyblok_tk[token]` is a validation token, not usable for
// CDN calls (PRD Q14) — so we store the token (+ detected region) keyed by space.

import type { Region } from "./regions";

const KEY = "sbpg:spaces";

export interface StoredSpace {
  token: string;
  region?: Region;
}

type Store = Record<string, StoredSpace>;

function readStore(): Store {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Store;
  } catch {
    return {};
  }
}

export function getSpace(spaceId: string): StoredSpace | null {
  return readStore()[spaceId] ?? null;
}

export function setSpace(spaceId: string, patch: Partial<StoredSpace> & { token: string }): void {
  const store = readStore();
  store[spaceId] = { ...store[spaceId], ...patch };
  localStorage.setItem(KEY, JSON.stringify(store));
}
