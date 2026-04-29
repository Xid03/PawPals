export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { prisma } from "@/server/prisma";
import { getPagination } from "@/server/pagination";
import { paginated, handleRouteError } from "@/server/responses";
import { z } from "zod";

const vetQuerySchema = z.object({
  q: z.string().optional(),
  city: z.string().optional(),
  open: z.coerce.boolean().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  service: z.enum(["CHECKUP", "VACCINATION", "DENTAL", "SURGERY", "EMERGENCY"]).optional()
});

export async function GET(request: NextRequest) {
  try {
    const page = getPagination(request.nextUrl.searchParams);
    const query = vetQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const where = {
      ...(query.q ? { name: { contains: query.q, mode: "insensitive" as const } } : {}),
      ...(query.city ? { city: { contains: query.city, mode: "insensitive" as const } } : {}),
      ...(query.open !== undefined ? { isOpen: query.open } : {}),
      ...(query.minRating !== undefined ? { rating: { gte: query.minRating } } : {}),
      ...(query.service ? { services: { some: { type: query.service } } } : {})
    };
    const vets = await prisma.vet.findMany({
      where,
      skip: page.skip,
      take: page.take,
      include: { services: true, _count: { select: { favorites: true, appointments: true } } },
      orderBy: [{ rating: "desc" }, { name: "asc" }]
    });
    return paginated(vets, page);
  } catch (error) {
    return handleRouteError(error);
  }
}

