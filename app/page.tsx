"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

const YOUTUBE_HOSTS = new Set(["youtube.com", "m.youtube.com", "music.youtube.com", "www.youtube.com"]);

function getInitialPlayerState(searchParams: { get: (key: string) => string | null }) {
  const initialUrl = searchParams.get("url")?.trim() || "";
  const queryVideoId = searchParams.get("v")?.trim() || null;

  return {
    initialUrl,
    initialVideoId: queryVideoId ?? (initialUrl ? extractVideoId(initialUrl) : null),
  };
}

function extractVideoId(rawUrl: string) {
  try {
    const url = new URL(rawUrl.trim());
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] || null;
    }

    if (YOUTUBE_HOSTS.has(host)) {
      if (url.pathname === "/watch") return url.searchParams.get("v");
      if (url.pathname.startsWith("/embed/")) return url.pathname.split("/embed/")[1]?.split("/")[0] || null;
      if (url.pathname.startsWith("/shorts/")) return url.pathname.split("/shorts/")[1]?.split("/")[0] || null;
      if (url.pathname.startsWith("/live/")) return url.pathname.split("/live/")[1]?.split("/")[0] || null;
    }
  } catch {
    return null;
  }

  return null;
}

function HomeContent() {
  const searchParams = useSearchParams();
  const { initialUrl, initialVideoId } = getInitialPlayerState(searchParams);

  const [url, setUrl] = useState(initialUrl);
  const [videoId, setVideoId] = useState<string | null>(initialVideoId);
  const [error, setError] = useState("");

  const handleLoad = () => {
    const id = extractVideoId(url);
    if (!id) {
      setError("Could not parse a YouTube video ID.");
      setVideoId(null);
      return;
    }
    setError("");
    setVideoId(id);
  };

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="flex w-full max-w-3xl flex-col gap-4">
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          <Link href="/" className="font-semibold text-slate-100 underline decoration-slate-500 underline-offset-4">
            Home Player
          </Link>
          <Link href="/channel" className="text-slate-300 underline-offset-4 transition hover:text-blue-400 hover:underline">
            Channel Explorer
          </Link>
        </nav>

        <h1 className="text-3xl text-slate-600 font-semibold">URL Player</h1>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && handleLoad()}
            placeholder="Paste YouTube URL"
            className="w-full rounded-md border border-slate-700 bg-slate-900 p-3 text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
          />
          <button
            onClick={handleLoad}
            className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-slate-200 transition hover:bg-slate-700"
          >
            Load
          </button>
        </div>
      </div>
      <div className="flex mt-2.5 w-full flex-col gap-4">
        {error && <p className="text-sm text-red-300">{error}</p>}

        <div className="player-wrap bg-black">
          {videoId ? (
            <iframe
              id="player"
              src={`https://www.youtube.com/embed/${videoId}?rel=1`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400">Paste a YouTube URL and hit Load</div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-950 p-6 text-slate-100">Loading...</main>}>
      <HomeContent />
    </Suspense>
  );
}
