"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

type VideoItem = {
  videoId: string;
  title: string;
  publishedAt: string;
  thumbnail: string;
  videoUrl: string;
};

const FAVORITE_CHANNELS = [
  "dotnet",
  "javascriptmastery",
  "PedroTechnologies",
  "programmingwithmosh",
  "freecodecamp",
  "BroCodez",
  "LennysPodcast"
] as const;

const COOKIE_NAME = "custom_channels";

function getCustomChannelsFromCookie(): string[] {
  if (typeof document === "undefined") return [];
  const match = document.cookie.match(new RegExp("(^| )" + COOKIE_NAME + "=([^;]+)"));
  if (match) {
    try {
      return JSON.parse(match[2]);
    } catch {
      return [];
    }
  }
  return [];
}

function setCustomChannelsCookie(channels: string[]): void {
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  document.cookie = `${COOKIE_NAME}=${JSON.stringify(channels)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function getPlayerLink(videoId: string) {
  return `/?v=${encodeURIComponent(videoId)}`;
}

export default function ChannelExplorerPage() {
  const [channelUrl, setChannelUrl] = useState("");
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [source, setSource] = useState("");
  const [customChannels, setCustomChannels] = useState<string[]>([]);
  const [newChannel, setNewChannel] = useState("");
  const [showAddInput, setShowAddInput] = useState(false);

  useEffect(() => {
    setCustomChannels(getCustomChannelsFromCookie());
  }, []);

  const handleAddChannel = () => {
    const channel = newChannel.trim();
    if (!channel) return;
    const updated = [...customChannels, channel];
    setCustomChannelsCookie(updated);
    setCustomChannels(updated);
    setNewChannel("");
    setShowAddInput(false);
  };

  const handleRemoveChannel = (channelToRemove: string) => {
    const updated = customChannels.filter((c) => c !== channelToRemove);
    setCustomChannelsCookie(updated);
    setCustomChannels(updated);
  };

  const fetchChannelVideos = async (inputValue = channelUrl) => {
    const normalizedInput = inputValue.trim();

    if (!normalizedInput) {
      setError("Enter a channel URL, ID, or username first.");
      return;
    }

    setError("");
    setVideos([]);
    setIsLoading(true);
    setSource("");

    try {
      const response = await fetch(`/api/channel-videos?channelUrl=${encodeURIComponent(normalizedInput)}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to load channel videos");
        setIsLoading(false);
        return;
      }

      setVideos(data.videos || []);
      setSource(data.source || "");
    } catch {
      setError("Could not fetch channel videos. Check the URL and network.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="flex w-full flex-col gap-4">
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          <Link href="/" className="text-slate-300 underline-offset-4 transition hover:text-blue-400 hover:underline">
            Home Player
          </Link>
          <Link href="/channel" className="font-semibold text-slate-100 underline decoration-slate-500 underline-offset-4">
            Channel Explorer
          </Link>
        </nav>

        <h1 className="text-3xl font-semibold text-slate-200">Channel Videos Explorer</h1>
        <p className="text-slate-400">
          Enter a YouTube channel URL, ID (UC...), username, or custom URL (/c/yourchannel). This page fetches the channel’s RSS feed and shows latest uploads.
        </p>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Channels</p>
            {!showAddInput && (
              <button
                onClick={() => setShowAddInput(true)}
                className="text-sm text-blue-400 transition hover:text-blue-300"
              >
                + Add Channel
              </button>
            )}
          </div>
          {showAddInput && (
            <div className="flex gap-2">
              <input
                value={newChannel}
                onChange={(e) => setNewChannel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddChannel()}
                placeholder="Enter channel name or URL"
                className="w-full rounded-md border border-slate-700 bg-slate-900 p-2 text-sm text-slate-100 outline-none focus:border-blue-500"
              />
              <button
                onClick={handleAddChannel}
                className="rounded-md border border-slate-700 bg-blue-600 px-3 py-1 text-sm text-slate-100 transition hover:bg-blue-500"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddInput(false);
                  setNewChannel("");
                }}
                className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-slate-300 transition hover:bg-slate-700"
              >
                Cancel
              </button>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {FAVORITE_CHANNELS.map((channel) => (
              <button
                key={channel}
                onClick={() => {
                  setChannelUrl(channel);
                  fetchChannelVideos(channel);
                }}
                className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-sm text-slate-200 transition hover:bg-slate-800"
              >
                {channel}
              </button>
            ))}
            {customChannels.map((channel) => (
              <div key={channel} className="group relative flex items-center">
                <button
                  onClick={() => {
                    setChannelUrl(channel);
                    fetchChannelVideos(channel);
                  }}
                  className="rounded-md border border-blue-800 bg-slate-900 px-3 py-1 text-sm text-blue-200 transition hover:bg-slate-800"
                >
                  {channel}
                </button>
                <button
                  onClick={() => handleRemoveChannel(channel)}
                  className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-red-600 text-xs text-white group-hover:flex"
                  title="Remove channel"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={channelUrl}
            onChange={(event) => setChannelUrl(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && fetchChannelVideos()}
            placeholder="https://www.youtube.com/channel/UC... or https://www.youtube.com/c/yourchannel"
            className="w-full rounded-md border border-slate-700 bg-slate-900 p-3 text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
          />
          <button
            onClick={() => fetchChannelVideos()}
            className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-slate-200 transition hover:bg-slate-700"
          >
            Load Latest Videos
          </button>
        </div>

        {error && <p className="text-sm text-red-300">{error}</p>}

        {isLoading && <p className="text-sm text-slate-400">Loading channel videos ...</p>}

        {source && <p className="text-sm text-slate-400">Feed source: {source}</p>}

        {videos.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            {videos.map((video) => (
              <article key={video.videoId} className="rounded-lg border border-slate-700 bg-slate-900 p-3">
                {video.thumbnail && (
                  <Link href={getPlayerLink(video.videoId)}>
                    <div className="relative h-44 w-full overflow-hidden rounded-md">
                      <Image
                        src={video.thumbnail}
                        alt={video.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </Link>
                )}
                <div className="mt-2 space-y-1">
                  <Link href={getPlayerLink(video.videoId)} className="text-base font-semibold text-slate-100 hover:text-blue-400">
                    {video.title}
                  </Link>
                  <a href={video.videoUrl} target="_blank" rel="noreferrer" className="text-xs text-slate-400 hover:text-slate-300">
                    Open on YouTube
                  </a>
                  <p className="text-xs text-slate-400">{new Date(video.publishedAt).toLocaleString()}</p>
                </div>
              </article>
            ))}
          </div>
        )}

        {videos.length === 0 && !isLoading && !error && (
          <div className="rounded-lg border border-dashed border-slate-700 p-6 text-center text-slate-400">
            Latest channel videos will appear here after loading an input.
          </div>
        )}
      </div>
    </main>
  );
}
