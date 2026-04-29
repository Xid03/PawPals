export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { prisma } from "@/server/prisma";
import { requireAuth } from "@/server/auth";
import { ok, handleRouteError } from "@/server/responses";
import { privateUser } from "@/server/serializers";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: auth.id } });
    return ok({ user: privateUser(user) });
  } catch (error) {
    return handleRouteError(error);
  }
}

