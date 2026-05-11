export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { prisma } from "@/server/prisma";
import { getTokenFromRequest, verifyAuthToken } from "@/server/auth";
import { getPagination } from "@/server/pagination";
import { paginated, handleRouteError } from "@/server/responses";

const cityCoordinates: Record<string, { latitude: number; longitude: number }> = {
  "kuala lumpur": { latitude: 3.139, longitude: 101.6869 },
  ipoh: { latitude: 4.5975, longitude: 101.0901 },
  "petaling jaya": { latitude: 3.1073, longitude: 101.6067 },
  "shah alam": { latitude: 3.0733, longitude: 101.5185 },
  penang: { latitude: 5.4164, longitude: 100.3327 },
  "johor bahru": { latitude: 1.4927, longitude: 103.7414 }
};

function numberParam(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

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

function catLocation(cat: { latitude: number | null; longitude: number | null; city: string | null }) {
  if (cat.latitude !== null && cat.longitude !== null) {
    return { latitude: cat.latitude, longitude: cat.longitude };
  }

  if (!cat.city) return null;
  return cityCoordinates[cat.city.toLowerCase()] ?? null;
}

async function optionalAuthId(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) return null;

  try {
    return (await verifyAuthToken(token)).id;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const authId = await optionalAuthId(request);
    const page = getPagination(request.nextUrl.searchParams);
    const city = request.nextUrl.searchParams.get("city") ?? undefined;
    const latitude = numberParam(request.nextUrl.searchParams.get("lat"));
    const longitude = numberParam(request.nextUrl.searchParams.get("lng"));
    const maxKm = numberParam(request.nextUrl.searchParams.get("radiusKm")) ?? 50;
    const strictRadius = request.nextUrl.searchParams.get("strictRadius") === "true";
    const cats = await prisma.catProfile.findMany({
      where: {
        ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
        ...(authId ? { ownerId: { not: authId } } : {}),
        NOT: {
          owner: { email: { endsWith: "@pawpals.test" } }
        }
      },
      include: { photos: true, owner: { select: { id: true, name: true, username: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" }
    });

    if (latitude === null || longitude === null) {
      return paginated(cats.slice(page.skip, page.skip + page.take), { ...page, total: cats.length });
    }

    const origin = { latitude, longitude };
    const withDistance = cats
      .map((cat) => {
        const location = catLocation(cat);
        const distance = location ? distanceKm(origin, location) : null;
        return {
          ...cat,
          distanceKm: distance === null ? null : Math.round(distance * 10) / 10
        };
      })
      .sort((a, b) => (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY));

    const nearby = withDistance.filter((cat) => cat.distanceKm !== null && cat.distanceKm <= maxKm);
    const results = strictRadius ? nearby : nearby.length ? nearby : withDistance;

    return paginated(results.slice(page.skip, page.skip + page.take), { ...page, total: results.length });
  } catch (error) {
    return handleRouteError(error);
  }
}

