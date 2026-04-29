export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { prisma } from "@/server/prisma";
import { requireAuth } from "@/server/auth";
import { ok, handleRouteError } from "@/server/responses";
import { ensureConversationParticipant } from "@/server/services";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(request);
    await ensureConversationParticipant(params.id, auth.id);
    await prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId: params.id, userId: auth.id } },
      data: { lastReadAt: new Date() }
    });
    await prisma.message.updateMany({
      where: { conversationId: params.id, senderId: { not: auth.id }, readAt: null },
      data: { readAt: new Date() }
    });
    return ok({ read: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

