export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { prisma } from "@/server/prisma";
import { requireAuth } from "@/server/auth";
import { getPagination } from "@/server/pagination";
import { paginated, handleRouteError } from "@/server/responses";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const page = getPagination(request.nextUrl.searchParams);
    const mode = request.nextUrl.searchParams.get("mode") ?? "for-you";
    const topic = request.nextUrl.searchParams.get("topic") ?? undefined;

    const followingIds =
      mode === "following"
        ? (
            await prisma.follow.findMany({
              where: { followerId: auth.id },
              select: { followingId: true }
            })
          ).map((follow) => follow.followingId)
        : [];

    const posts = await prisma.post.findMany({
      where: {
        ...(topic ? { topic: topic as never } : {}),
        ...(mode === "following" ? { authorId: { in: followingIds } } : {})
      },
      skip: page.skip,
      take: page.take,
      include: {
        author: { select: { id: true, name: true, username: true, avatarUrl: true } },
        images: true,
        _count: { select: { likes: true, comments: true, saves: true } }
      },
      orderBy:
        mode === "trending"
          ? [{ likes: { _count: "desc" } }, { comments: { _count: "desc" } }]
          : { createdAt: "desc" }
    });

    return paginated(posts, page);
  } catch (error) {
    return handleRouteError(error);
  }
}

