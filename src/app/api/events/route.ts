export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { prisma } from "@/server/prisma";
import { requireAuth } from "@/server/auth";
import { getPagination } from "@/server/pagination";
import { ok, paginated, handleRouteError } from "@/server/responses";
import { parseJson } from "@/server/route-utils";
import { eventSchema } from "@/server/validators";
import { z } from "zod";

const eventQuerySchema = z.object({
  q: z.string().optional(),
  category: z.enum(["NEARBY", "WORKSHOPS", "MEETUPS", "ADOPTION"]).optional(),
  city: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const page = getPagination(request.nextUrl.searchParams);
    const query = eventQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const events = await prisma.event.findMany({
      where: {
        startsAt: { gte: new Date() },
        ...(query.q ? { title: { contains: query.q, mode: "insensitive" } } : {}),
        ...(query.category ? { category: query.category } : {}),
        ...(query.city ? { city: { contains: query.city, mode: "insensitive" } } : {})
      },
      skip: page.skip,
      take: page.take,
      include: {
        organizer: { select: { id: true, name: true, username: true, avatarUrl: true } },
        _count: { select: { rsvps: true, saves: true } }
      },
      orderBy: { startsAt: "asc" }
    });
    return paginated(events, page);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const input = await parseJson(request, eventSchema);
    const event = await prisma.event.create({
      data: { ...input, organizerId: auth.id, startsAt: new Date(input.startsAt) }
    });
    return ok({ event }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

