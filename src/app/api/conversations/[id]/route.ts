export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { prisma } from "@/server/prisma";
import { requireAuth } from "@/server/auth";
import { ok, handleRouteError } from "@/server/responses";
import { ensureConversationParticipant } from "@/server/services";

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(request);
    await ensureConversationParticipant(params.id, auth.id);
    await prisma.conversationParticipant.delete({
      where: { conversationId_userId: { conversationId: params.id, userId: auth.id } }
    });

    const remainingParticipants = await prisma.conversationParticipant.count({
      where: { conversationId: params.id }
    });
    if (remainingParticipants === 0) {
      await prisma.conversation.delete({ where: { id: params.id } });
    }

    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
