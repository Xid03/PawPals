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
    const requests = await prisma.followRequest.findMany({
      where: { targetId: auth.id, status: "PENDING" },
      skip: page.skip,
      take: page.take,
      include: { requester: true },
      orderBy: { createdAt: "desc" }
    });

    return paginated(requests, page);
  } catch (error) {
    return handleRouteError(error);
  }
}
