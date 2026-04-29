export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { prisma } from "@/server/prisma";
import { requireAuth } from "@/server/auth";
import { getPagination } from "@/server/pagination";
import { ok, paginated, handleRouteError } from "@/server/responses";
import { parseJson } from "@/server/route-utils";
import { conversationSchema } from "@/server/validators";
import { getOrCreateConversation } from "@/server/services";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const page = getPagination(request.nextUrl.searchParams);
    const conversations = await prisma.conversation.findMany({
      where: { participants: { some: { userId: auth.id } } },
      skip: page.skip,
      take: page.take,
      include: {
        participants: { include: { user: { select: { id: true, name: true, username: true, avatarUrl: true } } } },
        messages: { take: 1, orderBy: { createdAt: "desc" } }
      },
      orderBy: { updatedAt: "desc" }
    });
    return paginated(conversations, page);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const input = await parseJson(request, conversationSchema);
    const conversation = await getOrCreateConversation(auth.id, input.userId);
    return ok({ conversation }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

