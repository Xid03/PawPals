export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/prisma";
import { requireAuth } from "@/server/auth";
import { rateLimit } from "@/server/rate-limit";
import { getPagination } from "@/server/pagination";
import { ok, paginated, handleRouteError, ApiRouteError } from "@/server/responses";
import { parseJson } from "@/server/route-utils";
import { messageSchema } from "@/server/validators";
import { canViewUserPrivateContent, ensureConversationParticipant } from "@/server/services";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(request);
    await ensureConversationParticipant(params.id, auth.id);
    const page = getPagination(request.nextUrl.searchParams);
    const messages = await prisma.message.findMany({
      where: { conversationId: params.id },
      skip: page.skip,
      take: page.take,
      include: { sender: { select: { id: true, name: true, username: true, avatarUrl: true } } },
      orderBy: { createdAt: "asc" }
    });
    return paginated(messages, page);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    rateLimit(request, "chat:message", { limit: 60, windowMs: 60_000 });
    const auth = await requireAuth(request);
    await ensureConversationParticipant(params.id, auth.id);
    const input = await parseJson(request, messageSchema);
    const recipients = await prisma.conversationParticipant.findMany({
      where: { conversationId: params.id, userId: { not: auth.id } },
      include: { user: { select: { id: true, isPrivate: true } } }
    });
    const canMessageRecipients = await Promise.all(
      recipients.map((recipient) => canViewUserPrivateContent(auth.id, recipient.user))
    );
    if (canMessageRecipients.some((canMessage) => !canMessage)) {
      throw new ApiRouteError(403, "PRIVATE_ACCOUNT", "This account is private and cannot receive messages");
    }
    const message = await prisma.message.create({
      data: {
        conversationId: params.id,
        senderId: auth.id,
        body: input.body,
        type: input.type,
        data: input.data as Prisma.InputJsonValue | undefined
      }
    });
    await prisma.conversation.update({ where: { id: params.id }, data: { updatedAt: new Date() } });
    await prisma.notification.createMany({
      data: recipients.map((recipient) => ({
        userId: recipient.userId,
        type: "NEW_MESSAGE",
        title: "New meow message",
        body: input.body.slice(0, 120),
        data: { conversationId: params.id, messageId: message.id }
      }))
    });
    return ok({ message }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

