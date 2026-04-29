export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { prisma } from "@/server/prisma";
import { requireAuth } from "@/server/auth";
import { ok, handleRouteError, ApiRouteError } from "@/server/responses";

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(request);
    const comment = await prisma.comment.findUnique({ where: { id: params.id } });
    if (!comment) throw new ApiRouteError(404, "NOT_FOUND", "Comment not found");
    if (comment.authorId !== auth.id) throw new ApiRouteError(403, "FORBIDDEN", "You do not own this comment");
    await prisma.comment.delete({ where: { id: params.id } });
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

