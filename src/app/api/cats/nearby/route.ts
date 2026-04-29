export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { prisma } from "@/server/prisma";
import { getPagination } from "@/server/pagination";
import { paginated, handleRouteError } from "@/server/responses";

export async function GET(request: NextRequest) {
  try {
    const page = getPagination(request.nextUrl.searchParams);
    const city = request.nextUrl.searchParams.get("city") ?? undefined;
    const cats = await prisma.catProfile.findMany({
      where: city ? { city: { contains: city, mode: "insensitive" } } : {},
      skip: page.skip,
      take: page.take,
      include: { photos: true, owner: { select: { id: true, name: true, username: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" }
    });
    return paginated(cats, page);
  } catch (error) {
    return handleRouteError(error);
  }
}

