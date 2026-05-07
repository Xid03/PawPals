export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { prisma } from "@/server/prisma";
import { requireAuth } from "@/server/auth";
import { ok, handleRouteError, ApiRouteError } from "@/server/responses";
import { publicUser } from "@/server/serializers";
import { canViewUserPrivateContent } from "@/server/services";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(request).catch(() => null);
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        cats: { include: { photos: true } },
        _count: { select: { followers: true, following: true, posts: true } }
      }
    });
    if (!user) throw new ApiRouteError(404, "NOT_FOUND", "User not found");
    const canViewPrivate = await canViewUserPrivateContent(auth?.id, user);
    const follow = auth
      ? await prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: auth.id, followingId: params.id } },
          select: { id: true }
        })
      : null;
    const followRequest = auth && !follow
      ? await prisma.followRequest.findUnique({
          where: { requesterId_targetId: { requesterId: auth.id, targetId: params.id } },
          select: { status: true }
        })
      : null;
    return ok({
      user: publicUser(user),
      cats: canViewPrivate ? user.cats : [],
      stats: canViewPrivate ? user._count : { posts: 0, followers: 0, following: 0 },
      isFollowing: Boolean(follow),
      followRequestStatus: followRequest?.status ?? null,
      canViewPrivate
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

