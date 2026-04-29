export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { prisma } from "@/server/prisma";
import { requireAuth } from "@/server/auth";
import { ok, handleRouteError } from "@/server/responses";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(request);
    await prisma.storyView.upsert({
      where: { storyId_userId: { storyId: params.id, userId: auth.id } },
      create: { storyId: params.id, userId: auth.id },
      update: {}
    });
    return ok({ viewed: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

