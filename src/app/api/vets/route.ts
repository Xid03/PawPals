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
  service: z.enum(["CHECKUP", "VACCINATION", "DENTAL", "SURGERY", "EMERGENCY"]).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional()
});

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function distanceKm(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number }
) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(request: NextRequest) {
  try {
    const page = getPagination(request.nextUrl.searchParams);
    const query = vetQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const where = {
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: "insensitive" as const } },
              { address: { contains: query.q, mode: "insensitive" as const } },
              { city: { contains: query.q, mode: "insensitive" as const } }
            ]
          }
        : {}),
      ...(query.city ? { city: { contains: query.city, mode: "insensitive" as const } } : {}),
      ...(query.open !== undefined ? { isOpen: query.open } : {}),
      ...(query.minRating !== undefined ? { rating: { gte: query.minRating } } : {}),
      ...(query.service ? { services: { some: { type: query.service } } } : {})
    };
    const vets = await prisma.vet.findMany({
      where,
      include: { services: true, _count: { select: { favorites: true, appointments: true } } },
      orderBy: [{ rating: "desc" }, { name: "asc" }]
    });

    if (query.lat === undefined || query.lng === undefined) {
      return paginated(vets.slice(page.skip, page.skip + page.take), { ...page, total: vets.length });
    }

    const origin = { latitude: query.lat, longitude: query.lng };
    const sorted = vets
      .map((vet) => {
        const distance =
          vet.latitude !== null && vet.longitude !== null
            ? distanceKm(origin, { latitude: vet.latitude, longitude: vet.longitude })
            : null;

        return {
          ...vet,
          distanceKm: distance === null ? null : Math.round(distance * 10) / 10
        };
      })
      .sort((a, b) => (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY));

    return paginated(sorted.slice(page.skip, page.skip + page.take), { ...page, total: sorted.length });
  } catch (error) {
    return handleRouteError(error);
  }
}

