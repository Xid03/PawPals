export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { prisma } from "@/server/prisma";
import { requireAuth } from "@/server/auth";
import { ok, handleRouteError, ApiRouteError } from "@/server/responses";
import { catSchema } from "@/server/validators";
import { ensureCatOwner } from "@/server/services";
import { parseJson } from "@/server/route-utils";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cat = await prisma.catProfile.findUnique({
      where: { id: params.id },
      include: { photos: true, owner: { select: { id: true, name: true, username: true, avatarUrl: true } } }
    });
    if (!cat) throw new ApiRouteError(404, "NOT_FOUND", "Cat profile not found");
    return ok({ cat });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(request);
    await ensureCatOwner(params.id, auth.id);
    const input = await parseJson(request, catSchema.partial());
    const cat = await prisma.catProfile.update({
      where: { id: params.id },
      data: input,
      include: { photos: true }
    });
    return ok({ cat });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(request);
    await ensureCatOwner(params.id, auth.id);
    await prisma.catProfile.delete({ where: { id: params.id } });
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

