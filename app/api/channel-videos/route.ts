import { NextRequest, NextResponse } from "next/server";
import { getChannelVideos } from "./services/channel-videos.service";

export async function GET(request: NextRequest) {
  const channelUrl = request.nextUrl.searchParams.get("channelUrl")?.trim();

  if (!channelUrl) {
    return NextResponse.json({ error: "channelUrl is required" }, { status: 400 });
  }

  const result = await getChannelVideos(channelUrl);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    source: result.source,
    videos: result.videos,
  });
}
