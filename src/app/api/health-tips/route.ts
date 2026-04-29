export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { prisma } from "@/server/prisma";
import { requireAuth } from "@/server/auth";
import { getPagination } from "@/server/pagination";
import { ok, paginated, handleRouteError } from "@/server/responses";
import { parseJson } from "@/server/route-utils";
import { healthTipSchema } from "@/server/validators";
import { z } from "zod";

const healthQuerySchema = z.object({
  q: z.string().optional(),
  category: z.enum(["NUTRITION", "GROOMING", "BEHAVIOR", "WELLNESS", "PREVENTIVE_CARE"]).optional()
});

export async function GET(request: NextRequest) {
  try {
    const page = getPagination(request.nextUrl.searchParams);
    const query = healthQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const tips = await prisma.healthTip.findMany({
      where: {
        ...(query.q ? { title: { contains: query.q, mode: "insensitive" } } : {}),
        ...(query.category ? { category: query.category } : {})
      },
      skip: page.skip,
      take: page.take,
      include: { _count: { select: { saves: true } } },
      orderBy: { publishedAt: "desc" }
    });
    return paginated(tips, page);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    const input = await parseJson(request, healthTipSchema);
    const tip = await prisma.healthTip.create({ data: input });
    return ok({ tip }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

