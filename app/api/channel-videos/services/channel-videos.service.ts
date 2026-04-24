type ChannelTarget = {
  channelId?: string;
  user?: string;
};

export type VideoEntry = {
  videoId: string;
  title: string;
  publishedAt: string;
  thumbnail: string;
  videoUrl: string;
};

export type ChannelVideosServiceResult =
  | {
      ok: true;
      source: string;
      videos: VideoEntry[];
    }
  | {
      ok: false;
      status: number;
      error: string;
    };

function unescapeXml(html: string): string {
  return html
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseChannelTarget(raw: string): ChannelTarget | null {
  const value = raw.trim();
  if (!value) return null;

  const readFirstPathSegment = (pathValue: string) =>
    pathValue
      .split("/")
      .filter(Boolean)[0]
      ?.trim();

  if (/^UC[0-9A-Za-z_-]{22}$/.test(value)) {
    return { channelId: value };
  }

  if (value.startsWith("@")) {
    const handle = value.slice(1).trim();
    if (handle) return { user: handle };
  }

  try {
    const url = new URL(value);
    const path = url.pathname.replace(/\/+$/, "");

    if (path.startsWith("/channel/")) {
      const id = readFirstPathSegment(path.split("/channel/")[1] ?? "");
      if (/^UC[0-9A-Za-z_-]{22}$/.test(id)) return { channelId: id };
    }
    if (path.startsWith("/user/")) {
      const user = readFirstPathSegment(path.split("/user/")[1] ?? "");
      if (user) return { user };
    }
    if (path.startsWith("/c/")) {
      const custom = readFirstPathSegment(path.split("/c/")[1] ?? "");
      if (custom) return { user: custom };
    }
    if (path.startsWith("/@")) {
      const handle = readFirstPathSegment(path.slice(2));
      if (handle) return { user: handle };
    }

    const channelIdParam = url.searchParams.get("channel_id");
    if (channelIdParam && /^UC[0-9A-Za-z_-]{22}$/.test(channelIdParam)) {
      return { channelId: channelIdParam };
    }
  } catch {
    // not a URL, treat as custom username
  }

  return { user: value };
}

type NextFetchInit = RequestInit & { next?: { revalidate?: number } };

const DEFAULT_HEADERS: Record<string, string> = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36",
  accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,application/atom+xml;q=0.9,*/*;q=0.8",
  "accept-language": "en-US,en;q=0.9",
};

async function fetchText(url: string, init?: NextFetchInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        ...DEFAULT_HEADERS,
        ...(init?.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchTextWithRetry(url: string, init?: NextFetchInit): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetchText(url, init);

      if (response.status === 429 || response.status >= 500) {
        if (attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          continue;
        }
      }

      return response;
    } catch (error) {
      lastError = error;
      if (attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        continue;
      }
    }
  }

  throw lastError;
}

async function resolveChannelTarget(target: ChannelTarget): Promise<ChannelTarget> {
  if (target.channelId || target.user === undefined) {
    return target;
  }

  const slug = target.user?.startsWith("@") ? target.user.slice(1) : target.user;
  if (!slug) return target;

  const candidateUrls = [
    `https://www.youtube.com/@${slug}/about`,
    `https://www.youtube.com/c/${slug}/about`,
    `https://www.youtube.com/user/${slug}/about`,
    `https://www.youtube.com/channel/${slug}/about`,
  ];

  for (const url of candidateUrls) {
    try {
      const response = await fetchTextWithRetry(url, { cache: "no-store" });
      if (!response.ok) continue;

      const html = await response.text();
      const canonicalMatch = html.match(/<link rel="canonical" href="([^"]+)"\/?\s*>/i);
      if (canonicalMatch) {
        const canonicalUrl = new URL(canonicalMatch[1]);
        const p = canonicalUrl.pathname.replace(/\/+$/, "");
        if (p.startsWith("/channel/")) {
          const id = p.split("/channel/")[1];
          if (/^UC[0-9A-Za-z_-]{22}$/.test(id)) return { channelId: id };
        }
      }

      const channelMatch = html.match(/\/channel\/(UC[0-9A-Za-z_-]{22})/i);
      if (channelMatch) {
        return { channelId: channelMatch[1] };
      }
    } catch {
      continue;
    }
  }

  return target;
}

function parseVideosFromRss(rss: string): VideoEntry[] {
  const entries = Array.from(rss.matchAll(/<entry>([\s\S]*?)<\/entry>/g));

  return entries
    .map((match) => {
      const item = match[1];
      const titleMatch = item.match(/<title>([\s\S]*?)<\/title>/i);
      const idMatch = item.match(/<id>([\s\S]*?)<\/id>/i);
      const publishedMatch = item.match(/<published>([\s\S]*?)<\/published>/i);
      const thumbnailMatch = item.match(/<media:thumbnail[^>]*url="([^"]+)"/i);

      const title = titleMatch ? unescapeXml(titleMatch[1].trim()) : "Untitled";
      const idText = idMatch ? idMatch[1].trim() : "";
      const videoId = idText.split(":").pop()?.trim() || "";
      const publishedAt = publishedMatch ? publishedMatch[1].trim() : "";
      const thumbnail = thumbnailMatch ? thumbnailMatch[1].trim() : "";

      if (!videoId) return null;

      return {
        videoId,
        title,
        publishedAt,
        thumbnail,
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
      };
    })
    .filter((entry): entry is VideoEntry => entry !== null)
    .slice(0, 20);
}

async function fetchFirstAvailableFeed(feeds: string[]) {
  let rss = "";
  let lastStatus: number | null = null;

  for (const feedUrl of feeds) {
    try {
      const response = await fetchTextWithRetry(feedUrl, { next: { revalidate: 60 * 5 } });
      if (!response.ok) {
        lastStatus = response.status;
        continue;
      }

      rss = await response.text();
      if (/<entry>[\s\S]*?<\/entry>/.test(rss)) {
        break;
      }
    } catch {
      continue;
    }
  }

  return { rss, lastStatus };
}

function buildFeedUrls(target: ChannelTarget): string[] {
  const feeds: string[] = [];

  if (target.channelId) {
    feeds.push(`https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(target.channelId)}`);
  }
  if (target.user) {
    feeds.push(`https://www.youtube.com/feeds/videos.xml?user=${encodeURIComponent(target.user)}`);
  }

  return feeds;
}

export async function getChannelVideos(channelUrl: string): Promise<ChannelVideosServiceResult> {
  const parsedTarget = parseChannelTarget(channelUrl);
  if (!parsedTarget) {
    return { ok: false, status: 400, error: "Invalid channel URL or identifier" };
  }

  const target = await resolveChannelTarget(parsedTarget);
  const feeds = buildFeedUrls(target);

  if (feeds.length === 0) {
    return { ok: false, status: 404, error: "Could not resolve channel target" };
  }

  const { rss, lastStatus } = await fetchFirstAvailableFeed(feeds);
  if (!rss) {
    if (lastStatus === 404) {
      return { ok: false, status: 404, error: "YouTube feed not found for this channel identifier" };
    }
    if (lastStatus === 429) {
      return { ok: false, status: 429, error: "YouTube rate-limited this request (try again shortly)" };
    }
    if (lastStatus && lastStatus >= 400) {
      return { ok: false, status: 502, error: `YouTube feed request failed (status ${lastStatus})` };
    }

    return { ok: false, status: 502, error: "Failed to fetch channel feed" };
  }

  const videos = parseVideosFromRss(rss);
  if (!videos.length) {
    return { ok: false, status: 404, error: "No videos found or feed parsing failed" };
  }

  return {
    ok: true,
    source: target.channelId ? `channelId:${target.channelId}` : `user:${target.user}`,
    videos,
  };
}
