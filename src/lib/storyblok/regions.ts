// Region auto-detect (PRD Q12): the editor gives us a token but not the region,
// so we race the token across the region CDN bases and keep the first that
// returns 200. One-time, ~5 parallel requests; callers can cache the result.

export type Region = "eu" | "us" | "ap" | "ca" | "cn";

export const REGION_BASES: Record<Region, string> = {
  eu: "https://api.storyblok.com",
  us: "https://api-us.storyblok.com",
  ap: "https://api-ap.storyblok.com",
  ca: "https://api-ca.storyblok.com",
  cn: "https://app.storyblokchina.cn",
};

export const REGION_LABELS: Record<Region, string> = {
  eu: "Europe",
  us: "United States",
  ap: "Asia-Pacific",
  ca: "Canada",
  cn: "China",
};

export interface StoryFetchResult {
  region: Region;
  base: string;
  // Loose on purpose — the playground renders whatever shape comes back (PRD Q4).
  story: Record<string, unknown>;
}

function fetchStoryFromRegion(
  region: Region,
  base: string,
  storyId: string,
  token: string,
  version: string,
  timeoutMs = 8000,
): Promise<StoryFetchResult> {
  const url =
    `${base}/v2/cdn/stories/${encodeURIComponent(storyId)}` +
    `?version=${encodeURIComponent(version)}&token=${encodeURIComponent(token)}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, { signal: controller.signal })
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(`${region}: HTTP ${res.status}`);
      }
      const json = (await res.json()) as { story?: Record<string, unknown> };
      return { region, base, story: json.story ?? json };
    })
    .finally(() => clearTimeout(timer));
}

/** Resolves with the first region whose CDN returns the story; rejects if none do. */
export function fetchStoryByIdAcrossRegions(
  storyId: string,
  token: string,
  version: string,
): Promise<StoryFetchResult> {
  const attempts = (Object.entries(REGION_BASES) as [Region, string][]).map(
    ([region, base]) =>
      fetchStoryFromRegion(region, base, storyId, token, version),
  );
  return Promise.any(attempts);
}
