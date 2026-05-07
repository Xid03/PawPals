export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { prisma } from "@/server/prisma";
import { getPagination } from "@/server/pagination";
import { paginated, handleRouteError } from "@/server/responses";
import { getTokenFromRequest, verifyAuthToken } from "@/server/auth";
import { publicUser } from "@/server/serializers";
import { ensureCanViewUserPrivateContent } from "@/server/services";

async function optionalAuthId(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) return null;

  try {
    return (await verifyAuthToken(token)).id;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await ensureCanViewUserPrivateContent(await optionalAuthId(request), params.id);
    const page = getPagination(request.nextUrl.searchParams);
    const rows = await prisma.follow.findMany({
      where: { followerId: params.id },
      skip: page.skip,
      take: page.take,
      include: { following: true },
      orderBy: { createdAt: "desc" }
    });
    return paginated(rows.map((row) => publicUser(row.following)), page);
  } catch (error) {
    return handleRouteError(error);
  }
}

