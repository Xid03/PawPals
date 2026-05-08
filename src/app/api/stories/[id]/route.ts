export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { prisma } from "@/server/prisma";
import { requireAuth } from "@/server/auth";
import { ok, handleRouteError, ApiRouteError } from "@/server/responses";

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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
      throw new ApiRouteError(403, "FORBIDDEN", "You can only delete your own stories");
    }

    await prisma.story.delete({ where: { id: params.id } });
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
