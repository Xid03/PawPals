export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { prisma } from "@/server/prisma";
import { requireAuth } from "@/server/auth";
import { getPagination } from "@/server/pagination";
import { ok, paginated, handleRouteError } from "@/server/responses";
import { catQuerySchema, catSchema } from "@/server/validators";
import { catWhereFromQuery } from "@/server/services";
import { parseJson, queryObject } from "@/server/route-utils";

export async function GET(request: NextRequest) {
  try {
    const page = getPagination(request.nextUrl.searchParams);
    const query = catQuerySchema.parse(queryObject(request));
    const where = catWhereFromQuery(query);
    const [cats, total] = await Promise.all([
      prisma.catProfile.findMany({
        where,
        skip: page.skip,
        take: page.take,
        include: { photos: true, owner: { select: { id: true, name: true, username: true, avatarUrl: true } } },
        orderBy: { createdAt: "desc" }
      }),
      prisma.catProfile.count({ where })
    ]);
    return paginated(cats, { ...page, total });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const input = await parseJson(request, catSchema);
    const cat = await prisma.catProfile.create({
      data: { ...input, ownerId: auth.id },
      include: { photos: true }
    });
    return ok({ cat }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

