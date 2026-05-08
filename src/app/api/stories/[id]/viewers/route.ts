export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { prisma } from "@/server/prisma";
import { requireAuth } from "@/server/auth";
import { paginated, handleRouteError, ApiRouteError } from "@/server/responses";
import { getPagination } from "@/server/pagination";
import { publicUser } from "@/server/serializers";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(request);
    const story = await prisma.story.findUnique({
      where: { id: params.id },
      select: { authorId: true }
    });

    if (!story) {
      throw new ApiRouteError(404, "NOT_FOUND", "Story not found");
    }
    if (story.authorId !== auth.id) {
      throw new ApiRouteError(403, "FORBIDDEN", "Only the story owner can view story viewers");
    }

    const page = getPagination(request.nextUrl.searchParams);
    const views = await prisma.storyView.findMany({
      where: { storyId: params.id, userId: { not: auth.id } },
      skip: page.skip,
      take: page.take,
      orderBy: { createdAt: "desc" }
    });
    const viewerIds = views.map((view) => view.userId);
    const users = viewerIds.length
      ? await prisma.user.findMany({
          where: { id: { in: viewerIds } },
          select: { id: true, name: true, username: true, avatarUrl: true, city: true, isPrivate: true }
        })
      : [];
    const userById = new Map(users.map((user) => [user.id, user]));
    const viewers = views
      .map((view) => userById.get(view.userId))
      .filter((user): user is NonNullable<typeof user> => Boolean(user))
      .map(publicUser);

    return paginated(viewers, page);
  } catch (error) {
    return handleRouteError(error);
  }
}
