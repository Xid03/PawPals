export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { requireAuth } from "@/server/auth";
import { ok, handleRouteError, ApiRouteError } from "@/server/responses";
import { parseJson } from "@/server/route-utils";
import { ensureConversationParticipant } from "@/server/services";

const updateMessageSchema = z.object({
  body: z.string().min(1).max(2000)
});

async function ensureOwnMessage(conversationId: string, messageId: string, userId: string) {
  await ensureConversationParticipant(conversationId, userId);
  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message || message.conversationId !== conversationId) {
    throw new ApiRouteError(404, "NOT_FOUND", "Message not found");
  }
  if (message.senderId !== userId) {
    throw new ApiRouteError(403, "FORBIDDEN", "You can only manage your own messages");
  }
  return message;
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string; messageId: string } }) {
  try {
    const auth = await requireAuth(request);
    const message = await ensureOwnMessage(params.id, params.messageId, auth.id);
    if (message.type === "IMAGE") {
      throw new ApiRouteError(400, "BAD_REQUEST", "Image messages cannot be edited");
    }

    const input = await parseJson(request, updateMessageSchema);
    const updated = await prisma.message.update({
      where: { id: params.messageId },
      data: { body: input.body },
      include: { sender: { select: { id: true, name: true, username: true, avatarUrl: true } } }
    });

    return ok({ message: updated });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string; messageId: string } }) {
  try {
    const auth = await requireAuth(request);
    await ensureOwnMessage(params.id, params.messageId, auth.id);
    await prisma.message.delete({ where: { id: params.messageId } });
    await prisma.conversation.update({ where: { id: params.id }, data: { updatedAt: new Date() } });
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
