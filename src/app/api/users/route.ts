export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { prisma } from "@/server/prisma";
import { getPagination } from "@/server/pagination";
import { paginated, handleRouteError } from "@/server/responses";
import { publicUser } from "@/server/serializers";

export async function GET(request: NextRequest) {
  try {
    const page = getPagination(request.nextUrl.searchParams);
    const query = request.nextUrl.searchParams.get("q")?.trim();
    const where = query
      ? {
          OR: [
            { username: { contains: query, mode: "insensitive" as const } },
            { name: { contains: query, mode: "insensitive" as const } },
            { city: { contains: query, mode: "insensitive" as const } }
          ]
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: page.skip,
        take: page.take,
        orderBy: { username: "asc" }
      }),
      prisma.user.count({ where })
    ]);

    return paginated(users.map(publicUser), { ...page, total });
  } catch (error) {
    return handleRouteError(error);
  }
}
