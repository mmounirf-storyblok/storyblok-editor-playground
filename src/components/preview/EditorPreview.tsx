import { useCallback, useEffect, useState } from "react";
import {
  DatabaseIcon,
  PencilSimpleIcon,
  CloudCheckIcon,
  GlobeHemisphereWestIcon,
  TranslateIcon,
} from "@phosphor-icons/react";
import { TooltipProvider } from "#components/ui/tooltip";
import { Item, ItemContent, ItemMedia, ItemTitle } from "#components/ui/item";
import { Spinner } from "#components/ui/spinner";
import { readEditorParams } from "#lib/storyblok/params";
import { fetchStoryByIdAcrossRegions, REGION_LABELS, type StoryFetchResult } from "#lib/storyblok/regions";
import { getSpace, setSpace } from "#lib/storyblok/spaces";
import { TooltipBadge } from "./TooltipBadge";
import { TokenPrompt } from "./TokenPrompt";
import StoryTree, { type Story } from "./StoryTree";

type State =
  | { status: "need-token" }
  | { status: "loading" }
  | { status: "ok"; result: StoryFetchResult }
  | { status: "error"; message: string };

export default function EditorPreview() {
  const params = readEditorParams();
  const [state, setState] = useState<State>({ status: "loading" });

  const load = useCallback(
    (token: string) => {
      if (!params.storyId) return;
      setState({ status: "loading" });
      fetchStoryByIdAcrossRegions(params.storyId, token, params.version)
        .then((result) => {
          if (params.spaceId) setSpace(params.spaceId, { token, region: result.region });
          setState({ status: "ok", result });
        })
        .catch((err: unknown) => {
          const message =
            err instanceof AggregateError
              ? err.errors.map((e) => (e as Error).message).join(", ")
              : String((err as Error)?.message ?? err);
          setState({ status: "error", message });
        });
    },
    [params.storyId, params.spaceId, params.version],
  );

  useEffect(() => {
    if (!params.storyId || !params.spaceId) {
      setState({ status: "error", message: "Missing story id or space id in URL params." });
      return;
    }
    const stored = getSpace(params.spaceId);
    if (stored?.token) load(stored.token);
    else setState({ status: "need-token" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.spaceId, params.storyId]);

  const storyName = state.status === "ok" ? String(state.result.story.name ?? "") : undefined;
  const region = state.status === "ok" ? state.result.region : undefined;
  const isPublished = params.version === "published";

  return (
    <TooltipProvider>
      <div className="mx-auto space-y-4 p-4">
        <header className="space-y-2">
          <h1 className="text-lg font-semibold tracking-tight">
            {storyName || "Storyblok Preview"}
          </h1>
          <div className="flex flex-wrap items-center gap-1.5">
            <TooltipBadge variant="secondary" tooltip="Storyblok space ID">
              <DatabaseIcon weight="fill" />
              Space {params.spaceId ?? "—"}
            </TooltipBadge>
            <TooltipBadge
              variant="secondary"
              tooltip={isPublished ? "Published (live) content" : "Unpublished draft content"}
            >
              {isPublished ? <CloudCheckIcon weight="fill" /> : <PencilSimpleIcon weight="fill" />}
              {isPublished ? "Published" : "Draft"}
            </TooltipBadge>
            {region && (
              <TooltipBadge
                variant="secondary"
                tooltip={`Served from the ${REGION_LABELS[region]} region (${region})`}
              >
                <GlobeHemisphereWestIcon weight="fill" />
                {REGION_LABELS[region]}
              </TooltipBadge>
            )}
            {params.lang && params.lang !== "default" && (
              <TooltipBadge variant="secondary" tooltip="Language">
                <TranslateIcon weight="fill" />
                {params.lang}
              </TooltipBadge>
            )}
          </div>
        </header>

        {state.status === "loading" && (
          <Item variant="muted">
            <ItemMedia>
              <Spinner />
            </ItemMedia>
            <ItemContent>
              <ItemTitle className="line-clamp-1">Detecting region &amp; fetching story…</ItemTitle>
            </ItemContent>
          </Item>
        )}

        {state.status === "need-token" && params.spaceId && (
          <TokenPrompt spaceId={params.spaceId} isPublished={isPublished} onSubmit={load} />
        )}

        {state.status === "error" && (
          <div className="space-y-3">
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {/401/.test(state.message)
                ? "The saved access token was rejected (401) — it may be invalid, revoked, or lack access to this content. Enter a token below."
                : state.message}
            </div>
            {params.spaceId && (
              <TokenPrompt spaceId={params.spaceId} isPublished={isPublished} onSubmit={load} />
            )}
          </div>
        )}

        {state.status === "ok" && <StoryTree story={state.result.story as unknown as Story} />}
      </div>
    </TooltipProvider>
  );
}
