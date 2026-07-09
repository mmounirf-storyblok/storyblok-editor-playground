// The one shape rule (PRD Q6/§6.3): detect bloks so we can recurse into them as
// their own tree nodes; everything else is a leaf rendered as JSON. No other
// field-type inference — the bridge doesn't need it.

export type Blok = Record<string, unknown> & {
  _uid?: string;
  component?: string;
  _editable?: string;
};

export function isBlok(v: unknown): v is Blok {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as Blok).component === "string" &&
    typeof (v as Blok)._uid === "string"
  );
}

/** An array whose every item is a blok (non-empty), else null. */
export function asBlokArray(v: unknown): Blok[] | null {
  if (Array.isArray(v) && v.length > 0 && v.every(isBlok)) {
    return v as Blok[];
  }
  return null;
}

// Shown in the node header or structurally, so kept out of the leaf JSON dump.
const HIDDEN = new Set(["_uid", "component", "_editable"]);

export interface ClassifiedFields {
  /** Fields that are bloks or blok arrays — rendered as child nodes. */
  childGroups: { name: string; bloks: Blok[] }[];
  /** Everything else — rendered as a JSON block. */
  leaf: Record<string, unknown>;
}

export function classifyFields(blok: Blok): ClassifiedFields {
  const childGroups: ClassifiedFields["childGroups"] = [];
  const leaf: Record<string, unknown> = {};

  for (const [name, value] of Object.entries(blok)) {
    if (HIDDEN.has(name)) continue;
    if (isBlok(value)) {
      childGroups.push({ name, bloks: [value] });
      continue;
    }
    const arr = asBlokArray(value);
    if (arr) {
      childGroups.push({ name, bloks: arr });
      continue;
    }
    leaf[name] = value;
  }

  return { childGroups, leaf };
}

function normalize(q: string): string {
  return q.trim().toLowerCase();
}

/** Does this blok itself match the query (component name or any leaf value)? */
export function blokSelfMatches(blok: Blok, query: string): boolean {
  const q = normalize(query);
  if (!q) return true;
  const hay = `${blok.component ?? ""} ${JSON.stringify(classifyFields(blok).leaf)}`;
  return hay.toLowerCase().includes(q);
}

/** True if this blok or any descendant matches — drives filtered visibility. */
export function blokSubtreeMatches(blok: Blok, query: string): boolean {
  if (!normalize(query)) return true;
  if (blokSelfMatches(blok, query)) return true;
  return classifyFields(blok).childGroups.some((g) =>
    g.bloks.some((b) => blokSubtreeMatches(b, query)),
  );
}

/**
 * A short human-readable preview of a blok — the first non-empty primitive leaf
 * value — so otherwise-identical rows (e.g. many `sharedTranslation`s) are
 * distinguishable at a glance. Returns null when there's nothing textual.
 */
export function blokPreview(blok: Blok): string | null {
  const { leaf } = classifyFields(blok);
  for (const value of Object.values(leaf)) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" || typeof value === "boolean") return String(value);
  }
  return null;
}

/** Every `_uid` in the subtree — used for expand/collapse all. */
export function collectUids(blok: Blok): string[] {
  const out: string[] = [];
  const walk = (b: Blok) => {
    if (b._uid) out.push(b._uid);
    classifyFields(b).childGroups.forEach((g) => g.bloks.forEach(walk));
  };
  walk(blok);
  return out;
}
