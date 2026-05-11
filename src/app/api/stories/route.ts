export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { prisma } from "@/server/prisma";
import { requireAuth } from "@/server/auth";
import { getPagination } from "@/server/pagination";
import { ok, paginated, handleRouteError } from "@/server/responses";
import { parseJson, queryObject } from "@/server/route-utils";
import { storySchema } from "@/server/validators";
import { z } from "zod";

const storyQuerySchema = z.object({
  authorId: z.string().optional(),
  mine: z.enum(["true", "false"]).optional()
});

type StoryWithCounts = Awaited<ReturnType<typeof prisma.story.findMany>>[number] & {
  author: { id: string; name: string; username: string; avatarUrl: string | null };
  _count: { likes: number; views: number };
  views?: { id: string }[];
};

async function withAccurateViewerCounts(stories: StoryWithCounts[], currentUserId?: string | null) {
  if (!stories.length) return stories;

  const authorByStoryId = new Map(stories.map((story) => [story.id, story.authorId]));
  const views = await prisma.storyView.findMany({
    where: { storyId: { in: stories.map((story) => story.id) } },
    select: { storyId: true, userId: true }
  });
  const countByStoryId = new Map<string, number>();

  views.forEach((view) => {
    const authorId = authorByStoryId.get(view.storyId);
    if (view.userId === authorId || view.userId === currentUserId) return;
    countByStoryId.set(view.storyId, (countByStoryId.get(view.storyId) ?? 0) + 1);
  });

  return stories.map((story) => ({
    ...story,
    viewedByMe: currentUserId ? Array.isArray(story.views) && story.views.length > 0 : false,
    _count: {
      ...story._count,
      views: countByStoryId.get(story.id) ?? 0
    }
  }));
}

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    await prisma.story.deleteMany({
      where: { expiresAt: { lte: now } }
    });
    const page = getPagination(request.nextUrl.searchParams);
    const query = storyQuerySchema.parse(queryObject(request));
    const auth = await requireAuth(request).catch((error) => {
      if (query.mine === "true") throw error;
      return null;
    });
    const authorId = query.mine === "true" ? auth?.id : query.authorId;
    const stories = await prisma.story.findMany({
      where: {
        expiresAt: { gt: now },
        ...(authorId ? { authorId } : {})
      },
      skip: page.skip,
      take: page.take,
      include: {
        author: { select: { id: true, name: true, username: true, avatarUrl: true } },
        views: auth?.id ? { where: { userId: auth.id }, select: { id: true } } : false,
        _count: { select: { likes: true, views: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    return paginated(await withAccurateViewerCounts(stories, auth?.id), page);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const input = await parseJson(request, storySchema);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const story = await prisma.story.create({
      data: {
        authorId: auth.id,
        url: input.url,
        type: input.type,
        caption: input.caption,
        expiresAt
      },
      include: { author: { select: { id: true, name: true, username: true, avatarUrl: true } }, _count: { select: { likes: true, views: true } } }
    });
    const [storyWithAccurateViews] = await withAccurateViewerCounts([story], auth.id);
    return ok({ story: storyWithAccurateViews }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

