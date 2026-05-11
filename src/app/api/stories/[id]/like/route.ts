export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { prisma } from "@/server/prisma";
import { requireAuth } from "@/server/auth";
import { ok, handleRouteError } from "@/server/responses";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(request);
    const story = await prisma.story.findUnique({
      where: { id: params.id },
      select: { authorId: true }
    });
    const existing = await prisma.storyLike.findUnique({
      where: { storyId_userId: { storyId: params.id, userId: auth.id } }
    });
    if (existing) {
      await prisma.storyLike.delete({ where: { id: existing.id } });
      return ok({ liked: false });
    }
    await prisma.storyLike.create({ data: { storyId: params.id, userId: auth.id } });
    if (story && story.authorId !== auth.id) {
      const likerLabel = auth.username ? `@${auth.username}` : auth.name ?? "Someone";
      await prisma.notification.create({
        data: {
          userId: story.authorId,
          type: "POST_LIKE",
          title: "New like",
          body: `${likerLabel} liked your story.`,
          data: {
            storyId: params.id,
            likerId: auth.id,
            likerUsername: auth.username,
            likerName: auth.name
          }
        }
      });
    }
    return ok({ liked: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

