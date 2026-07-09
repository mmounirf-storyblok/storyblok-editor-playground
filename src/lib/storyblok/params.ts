// Reads the Visual Editor preview params the Storyblok bridge appends to the
// iframe URL. Shape mirrors `PreviewSearchParams` in @storyblok/storyblok-bridge.
// The `_storyblok_tk[token]` value is a preview-scoped delivery token we can use
// directly against the CDN — this is what makes the editor flow zero-config.

export interface EditorParams {
  /** Story id (`_storyblok`). */
  storyId: string | null;
  /** Space id (`_storyblok_tk[space_id]`). */
  spaceId: string | null;
  /** Preview-scoped delivery token (`_storyblok_tk[token]`). */
  token: string | null;
  /** `_storyblok_version` — "draft" | "published"; defaults to draft. */
  version: string;
  /** `_storyblok_lang`. */
  lang: string | null;
  /** `_storyblok_release`. */
  release: string | null;
}

export function readEditorParams(search = window.location.search): EditorParams {
  const p = new URLSearchParams(search);
  return {
    storyId: p.get("_storyblok"),
    spaceId: p.get("_storyblok_tk[space_id]"),
    token: p.get("_storyblok_tk[token]"),
    version: p.get("_storyblok_version") || "draft",
    lang: p.get("_storyblok_lang"),
    release: p.get("_storyblok_release"),
  };
}

// Editor mode = the Visual Editor loaded us with its preview token. The bridge
// itself keys off `_storyblok_tk`, so we do too.
export function isEditorMode(search = window.location.search): boolean {
  return search.includes("_storyblok_tk");
}
