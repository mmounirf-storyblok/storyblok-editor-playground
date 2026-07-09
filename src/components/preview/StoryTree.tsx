import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadStoryblokBridge, registerStoryblokBridge } from "@storyblok/react";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { Input } from "#components/ui/input";
import { Button } from "#components/ui/button";
import BlokNode from "./BlokNode";
import JsonSheet from "./JsonSheet";
import { TreeContext, type TreeCtx } from "#hooks/use-tree";
import { collectUids, blokSubtreeMatches, type Blok } from "#lib/storyblok/blok";

export interface Story {
  id: number;
  name?: string;
  content: Blok;
}

export default function StoryTree({ story }: { story: Story }) {
  const [live, setLive] = useState<Story | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [inspect, setInspect] = useState<Blok | null>(null);
  const [filter, setFilter] = useState("");
  const [focusedUid, setFocusedUid] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Memoized so the bridge effect doesn't re-run and stack listeners (PRD §6.1).
  const bridgeOptions = useMemo(() => ({}), []);

  useEffect(() => {
    loadStoryblokBridge();
    registerStoryblokBridge(story.id, (s) => setLive(s as unknown as Story), bridgeOptions);
  }, [story.id, bridgeOptions]);

  const current = live && live.id === story.id ? live : story;

  // Editor → tree sync: the bridge stamps `data-blok-focused` on the selected
  // element; mirror it as `focusedUid` and scroll it into view.
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const sync = () => {
      const el = root.querySelector<HTMLElement>("[data-blok-focused]");
      if (!el) return;
      setFocusedUid(el.getAttribute("data-uid"));
      el.scrollIntoView({ block: "nearest" });
    };
    const observer = new MutationObserver(sync);
    observer.observe(root, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-blok-focused"],
    });
    sync();
    return () => observer.disconnect();
  }, [current]);

  const toggle = useCallback((uid: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  }, []);

  const ctx: TreeCtx = useMemo(
    () => ({
      isCollapsed: (uid) => collapsed.has(uid),
      toggle,
      openInspect: (b) => setInspect(b),
      focusedUid,
      filter,
    }),
    [collapsed, toggle, focusedUid, filter],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter blocks…"
            className="h-8 pl-8"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => setCollapsed(new Set())}>
          Expand all
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCollapsed(new Set(collectUids(current.content)))}
        >
          Collapse all
        </Button>
      </div>

      <div ref={containerRef} className="rounded-lg border bg-card p-2">
        {filter !== "" && !blokSubtreeMatches(current.content, filter) ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm font-medium">
              No blocks match “{filter}”
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Search matches component names and field values (not nested block contents’ own uids).
            </p>
          </div>
        ) : (
          <TreeContext.Provider value={ctx}>
            <BlokNode blok={current.content} />
          </TreeContext.Provider>
        )}
      </div>

      <JsonSheet blok={inspect} onOpenChange={(open) => !open && setInspect(null)} />
    </div>
  );
}
