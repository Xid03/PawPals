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
    const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

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
        ...(mode === "following" ? { authorId: { in: followingIds } } : {}),
        ...(mode === "saved" ? { saves: { some: { userId: auth.id } } } : {}),
        ...(q
          ? {
              OR: [
                { text: { contains: q, mode: "insensitive" as const } },
                { topic: { equals: q.toUpperCase() as never } },
                { author: { name: { contains: q, mode: "insensitive" as const } } },
                { author: { username: { contains: q.replace(/^@/, ""), mode: "insensitive" as const } } }
              ]
            }
          : {}),
        author: { OR: [{ isPrivate: false }, { id: auth.id }, { followers: { some: { followerId: auth.id } } }] }
      },
      skip: page.skip,
      take: page.take,
      include: {
        author: { select: { id: true, name: true, username: true, avatarUrl: true, isPrivate: true } },
        images: true,
        likes: { where: { userId: auth.id }, select: { id: true } },
        saves: { where: { userId: auth.id }, select: { id: true } },
        _count: { select: { likes: true, comments: true, saves: true } }
      },
      orderBy:
        mode === "trending"
          ? [{ likes: { _count: "desc" } }, { comments: { _count: "desc" } }]
          : { createdAt: "desc" }
    });

    return paginated(posts.map((post) => ({ ...post, likedByMe: post.likes.length > 0, savedByMe: post.saves.length > 0 })), page);
  } catch (error) {
    return handleRouteError(error);
  }
}

