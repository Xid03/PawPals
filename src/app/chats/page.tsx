import { ChatClient } from "@/components/ChatClient";
import type { ApiConversation } from "@/lib/api-client";
import { getCurrentUserFromCookie } from "@/server/current-user";
import { prisma } from "@/server/prisma";

export const dynamic = "force-dynamic";

async function getInitialConversations(userId: string): Promise<ApiConversation[]> {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      take: 20,
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, username: true, avatarUrl: true } }
          }
        },
        messages: { take: 1, orderBy: { createdAt: "desc" } }
      },
      orderBy: { updatedAt: "desc" }
    });

    return await Promise.all(
      conversations.map(async (conversation) => {
        const participant = conversation.participants.find((item) => item.userId === userId);
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conversation.id,
            senderId: { not: userId },
            ...(participant?.lastReadAt ? { createdAt: { gt: participant.lastReadAt } } : {})
          }
        });

        return {
          id: conversation.id,
          participants: conversation.participants.map((participant) => ({
            user: participant.user
          })),
          messages: conversation.messages.map((message) => ({
            id: message.id,
            body: message.body,
            type: message.type,
            senderId: message.senderId,
            createdAt: message.createdAt.toISOString()
          })),
          unreadCount
        };
      })
    );
  } catch {
    return [];
  }
}

export default async function ChatPage() {
  const user = await getCurrentUserFromCookie();
  const initialConversations = user ? await getInitialConversations(user.id) : [];

  return (
    <ChatClient
      initialGuestLocked={!user}
      initialConversations={initialConversations}
      initialCurrentUserId={user?.id ?? null}
    />
  );
}
