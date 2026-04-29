export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { prisma } from "@/server/prisma";
import { requireAuth } from "@/server/auth";
import { ok, handleRouteError, ApiRouteError } from "@/server/responses";

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(request);
    const appointment = await prisma.appointment.findUnique({ where: { id: params.id } });
    if (!appointment) throw new ApiRouteError(404, "NOT_FOUND", "Appointment not found");
    if (appointment.userId !== auth.id) throw new ApiRouteError(403, "FORBIDDEN", "You do not own this appointment");
    const updated = await prisma.appointment.update({
      where: { id: params.id },
      data: { status: "CANCELLED" }
    });
    return ok({ appointment: updated });
  } catch (error) {
    return handleRouteError(error);
  }
}

