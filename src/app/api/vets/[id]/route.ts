export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { prisma } from "@/server/prisma";
import { ok, handleRouteError, ApiRouteError } from "@/server/responses";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const vet = await prisma.vet.findUnique({
      where: { id: params.id },
      include: { services: true, _count: { select: { favorites: true, appointments: true } } }
    });
    if (!vet) throw new ApiRouteError(404, "NOT_FOUND", "Vet not found");
    return ok({ vet });
  } catch (error) {
    return handleRouteError(error);
  }
}

