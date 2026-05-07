export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { prisma } from "@/server/prisma";
import { getTokenFromRequest, requireAuth, verifyAuthToken } from "@/server/auth";
import { getPagination } from "@/server/pagination";
import { ok, paginated, handleRouteError } from "@/server/responses";
import { parseJson } from "@/server/route-utils";
import { eventSchema } from "@/server/validators";
import { z } from "zod";

const eventQuerySchema = z.object({
  q: z.string().optional(),
  category: z.enum(["NEARBY", "WORKSHOPS", "MEETUPS", "ADOPTION"]).optional(),
  city: z.string().optional(),
  mode: z.enum(["saved"]).optional(),
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

const cityCoordinates: Record<string, { latitude: number; longitude: number }> = {
  "kuala lumpur": { latitude: 3.139, longitude: 101.6869 },
  "petaling jaya": { latitude: 3.1073, longitude: 101.6067 },
  shahalam: { latitude: 3.0733, longitude: 101.5185 },
  "shah alam": { latitude: 3.0733, longitude: 101.5185 },
  ipoh: { latitude: 4.5975, longitude: 101.0901 },
  penang: { latitude: 5.4164, longitude: 100.3327 },
  johor: { latitude: 1.4927, longitude: 103.7414 },
  "johor bahru": { latitude: 1.4927, longitude: 103.7414 },
  kuching: { latitude: 1.5533, longitude: 110.3592 },
  "kota kinabalu": { latitude: 5.9804, longitude: 116.0735 }
};

function coordinatesForEvent(event: { latitude: number | null; longitude: number | null; city: string | null }) {
  if (event.latitude !== null && event.longitude !== null) {
    return { latitude: event.latitude, longitude: event.longitude };
  }

  const city = event.city?.trim().toLowerCase();
  return city ? cityCoordinates[city] ?? null : null;
}

async function getOptionalAuthId(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) return null;

  try {
    const auth = await verifyAuthToken(token);
    return auth.id;
  } catch {
    return null;
  }
}

function withSavedByMe<T extends object>(event: T & { saves: { userId: string }[] }) {
  const { saves, ...rest } = event;
  return {
    ...rest,
    savedByMe: Boolean(saves?.length)
  };
}

export async function GET(request: NextRequest) {
  try {
    const page = getPagination(request.nextUrl.searchParams);
    const query = eventQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const authId = query.mode === "saved" ? (await requireAuth(request)).id : await getOptionalAuthId(request);
    const savedUserId = authId ?? "";
    const events = await prisma.event.findMany({
      where: {
        startsAt: { gte: new Date() },
        ...(query.q
          ? {
              OR: [
                { title: { contains: query.q, mode: "insensitive" } },
                { description: { contains: query.q, mode: "insensitive" } },
                { location: { contains: query.q, mode: "insensitive" } },
                { city: { contains: query.q, mode: "insensitive" } }
              ]
            }
          : {}),
        ...(query.category ? { category: query.category } : {}),
        ...(query.city ? { city: { contains: query.city, mode: "insensitive" } } : {}),
        ...(query.mode === "saved" ? { saves: { some: { userId: savedUserId } } } : {})
      },
      include: {
        organizer: { select: { id: true, name: true, username: true, avatarUrl: true } },
        saves: { where: { userId: savedUserId }, select: { userId: true } },
        _count: { select: { rsvps: true, saves: true } }
      },
      orderBy: { startsAt: "asc" }
    });

    if (query.lat === undefined || query.lng === undefined) {
      return paginated(events.slice(page.skip, page.skip + page.take).map(withSavedByMe), { ...page, total: events.length });
    }

    const origin = { latitude: query.lat, longitude: query.lng };
    const sorted = events
      .map((event) => {
        const coordinates = coordinatesForEvent(event);
        const distance = coordinates ? distanceKm(origin, coordinates) : null;

        return {
          ...event,
          distanceKm: distance === null ? null : Math.round(distance * 10) / 10
        };
      })
      .sort((a, b) => (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY));

    return paginated(sorted.slice(page.skip, page.skip + page.take).map(withSavedByMe), { ...page, total: sorted.length });
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

