import { storyblokEditable, type SbBlokData } from "@storyblok/react";
import { CaretRightIcon, BracketsCurlyIcon, RowsIcon, StackIcon } from "@phosphor-icons/react";
import { cn } from "#lib/utils";
import { Button } from "#components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "#components/ui/tooltip";
import { classifyFields, blokSubtreeMatches, blokPreview, type Blok } from "#lib/storyblok/blok";
import { useTree } from "#hooks/use-tree";
import { TooltipBadge } from "./TooltipBadge";

// One node per blok. The wrapper carries `storyblokEditable` (data-blok-c) so a
// click anywhere in the row resolves to this blok via the bridge's `closest()`.
// Children render inside the wrapper as DOM descendants.
export default function BlokNode({ blok }: { blok: Blok }) {
  const tree = useTree();
  const uid = blok._uid ?? "";
  const { childGroups, leaf } = classifyFields(blok);
  const hasChildren = childGroups.length > 0;
  const expanded = tree.filter !== "" || !tree.isCollapsed(uid);
  const fieldCount = Object.keys(leaf).length;
  const childCount = childGroups.reduce((n, g) => n + g.bloks.length, 0);
  const focused = tree.focusedUid !== null && tree.focusedUid === uid;
  const preview = blokPreview(blok);

  if (!blokSubtreeMatches(blok, tree.filter)) return null;

  return (
    <div
      {...storyblokEditable(blok as unknown as SbBlokData)}
      data-uid={uid}
      className="select-none"
    >
      <div
        className={cn(
          "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-accent",
          focused && "bg-accent ring-1 ring-primary/60",
        )}
      >
        {hasChildren ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={expanded ? "Collapse" : "Expand"}
                  className="text-muted-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    tree.toggle(uid);
                  }}
                >
                  <CaretRightIcon className={cn("transition-transform", expanded && "rotate-90")} />
                </Button>
              }
            />
            <TooltipContent>{expanded ? "Collapse" : "Expand"}</TooltipContent>
          </Tooltip>
        ) : (
          <span className="size-6" aria-hidden />
        )}

        <span className="shrink-0 font-medium font-mono">{blok.component}</span>
        {preview && (
          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{preview}</span>
        )}

        <span className="ml-auto flex shrink-0 items-center gap-2.5 text-[11px] text-muted-foreground">
          {fieldCount > 0 && (
            <TooltipBadge
              variant="secondary"
              tooltip={`${fieldCount} field${fieldCount === 1 ? "" : "s"}`}
            >
              <RowsIcon />
              {fieldCount}
            </TooltipBadge>
          )}
          {childCount > 0 && (
            <TooltipBadge
              variant="secondary"
              tooltip={`${childCount} nested block${childCount === 1 ? "" : "s"}`}
            >
              <StackIcon />
              {childCount}
            </TooltipBadge>
          )}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="secondary"
                  size="icon-xs"
                  aria-label="Inspect JSON"
                  className="text-muted-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    tree.openInspect(blok);
                  }}
                >
                  <BracketsCurlyIcon />
                </Button>
              }
            />
            <TooltipContent>Inspect JSON</TooltipContent>
          </Tooltip>
        </span>
      </div>

      {hasChildren && expanded && (
        <div className="ml-2 border-l border-border/60 pl-2">
          {childGroups.map((group) => (
            <div key={group.name}>
              <div className="px-2 pt-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60 font-mono">
                {group.name}
              </div>
              {group.bloks.map((child) => (
                <BlokNode key={child._uid} blok={child} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
