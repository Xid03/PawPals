export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { prisma } from "@/server/prisma";
import { getTokenFromRequest, requireAuth, verifyAuthToken } from "@/server/auth";
import { ok, handleRouteError, ApiRouteError } from "@/server/responses";
import { parseJson } from "@/server/route-utils";
import { eventSchema } from "@/server/validators";

async function ensureEventOwner(eventId: string, userId: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new ApiRouteError(404, "NOT_FOUND", "Event not found");
  if (event.organizerId !== userId) throw new ApiRouteError(403, "FORBIDDEN", "You do not own this event");
  return event;
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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authId = await getOptionalAuthId(request);
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        organizer: { select: { id: true, name: true, username: true, avatarUrl: true } },
        saves: { where: { userId: authId ?? "" }, select: { userId: true } },
        _count: { select: { rsvps: true, saves: true } }
      }
    });
    if (!event) throw new ApiRouteError(404, "NOT_FOUND", "Event not found");
    const { saves, ...eventData } = event;
    return ok({ event: { ...eventData, savedByMe: Boolean(saves.length) } });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(request);
    await ensureEventOwner(params.id, auth.id);
    const input = await parseJson(request, eventSchema.partial());
    const event = await prisma.event.update({
      where: { id: params.id },
      data: { ...input, startsAt: input.startsAt ? new Date(input.startsAt) : undefined }
    });
    return ok({ event });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(request);
    await ensureEventOwner(params.id, auth.id);
    await prisma.event.delete({ where: { id: params.id } });
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

