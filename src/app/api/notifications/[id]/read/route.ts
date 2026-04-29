export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { prisma } from "@/server/prisma";
import { requireAuth } from "@/server/auth";
import { ok, handleRouteError, ApiRouteError } from "@/server/responses";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(request);
    const notification = await prisma.notification.findUnique({ where: { id: params.id } });
    if (!notification) throw new ApiRouteError(404, "NOT_FOUND", "Notification not found");
    if (notification.userId !== auth.id) throw new ApiRouteError(403, "FORBIDDEN", "You do not own this notification");
    const updated = await prisma.notification.update({
      where: { id: params.id },
      data: { readAt: new Date() }
    });
    return ok({ notification: updated });
  } catch (error) {
    return handleRouteError(error);
  }
}

