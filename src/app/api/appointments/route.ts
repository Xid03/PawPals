export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { prisma } from "@/server/prisma";
import { requireAuth } from "@/server/auth";
import { getPagination } from "@/server/pagination";
import { ok, paginated, handleRouteError } from "@/server/responses";
import { parseJson } from "@/server/route-utils";
import { appointmentSchema } from "@/server/validators";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const page = getPagination(request.nextUrl.searchParams);
    const appointments = await prisma.appointment.findMany({
      where: { userId: auth.id },
      skip: page.skip,
      take: page.take,
      include: { vet: { include: { services: true } } },
      orderBy: { startsAt: "desc" }
    });
    return paginated(appointments, page);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const input = await parseJson(request, appointmentSchema);
    const appointment = await prisma.appointment.create({
      data: { ...input, userId: auth.id, startsAt: new Date(input.startsAt) },
      include: { vet: true }
    });
    await prisma.notification.create({
      data: {
        userId: auth.id,
        type: "APPOINTMENT_UPDATE",
        title: "Appointment requested",
        body: "Your vet appointment request is pending.",
        data: { appointmentId: appointment.id }
      }
    });
    return ok({ appointment }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

