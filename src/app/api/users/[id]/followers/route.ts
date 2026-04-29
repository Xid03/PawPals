export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { prisma } from "@/server/prisma";
import { getPagination } from "@/server/pagination";
import { paginated, handleRouteError } from "@/server/responses";
import { publicUser } from "@/server/services";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const page = getPagination(request.nextUrl.searchParams);
    const rows = await prisma.follow.findMany({
      where: { followingId: params.id },
      skip: page.skip,
      take: page.take,
      include: { follower: true },
      orderBy: { createdAt: "desc" }
    });
    return paginated(rows.map((row) => publicUser(row.follower)), page);
  } catch (error) {
    return handleRouteError(error);
  }
}

