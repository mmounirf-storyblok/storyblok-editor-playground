import { createContext, useContext } from "react";
import type { Blok } from "#lib/storyblok/blok";

// Shared tree state, so BlokNode rows don't prop-drill.
export interface TreeCtx {
  isCollapsed: (uid: string) => boolean;
  toggle: (uid: string) => void;
  openInspect: (blok: Blok) => void;
  /** `_uid` currently selected in the editor (via `data-blok-focused`). */
  focusedUid: string | null;
  filter: string;
}

export const TreeContext = createContext<TreeCtx | null>(null);

export function useTree(): TreeCtx {
  const ctx = useContext(TreeContext);
  if (!ctx) throw new Error("useTree must be used within a TreeContext provider");
  return ctx;
}
