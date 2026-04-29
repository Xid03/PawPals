export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { prisma } from "@/server/prisma";
import { ok, handleRouteError, ApiRouteError } from "@/server/responses";
import { publicUser } from "@/server/serializers";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        cats: { include: { photos: true } },
        _count: { select: { followers: true, following: true, posts: true } }
      }
    });
    if (!user) throw new ApiRouteError(404, "NOT_FOUND", "User not found");
    return ok({ user: publicUser(user), cats: user.cats, stats: user._count });
  } catch (error) {
    return handleRouteError(error);
  }
}

