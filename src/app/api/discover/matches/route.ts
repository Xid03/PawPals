export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { prisma } from "@/server/prisma";
import { requireAuth } from "@/server/auth";
import { getPagination } from "@/server/pagination";
import { paginated, handleRouteError } from "@/server/responses";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const page = getPagination(request.nextUrl.searchParams);
    const matches = await prisma.match.findMany({
      where: {
        OR: [{ userAId: auth.id }, { userBId: auth.id }],
        NOT: [
          { userA: { email: { endsWith: "@pawpals.test" } } },
          { userB: { email: { endsWith: "@pawpals.test" } } }
        ]
      },
      skip: page.skip,
      take: page.take,
      include: {
        userA: { select: { id: true, name: true, username: true, avatarUrl: true } },
        userB: { select: { id: true, name: true, username: true, avatarUrl: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    return paginated(matches, page);
  } catch (error) {
    return handleRouteError(error);
  }
}

