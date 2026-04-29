export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/prisma";
import { requireAuth } from "@/server/auth";
import { getPagination } from "@/server/pagination";
import { ok, paginated, handleRouteError } from "@/server/responses";
import { parseJson } from "@/server/route-utils";
import { notificationSchema } from "@/server/validators";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const page = getPagination(request.nextUrl.searchParams);
    const notifications = await prisma.notification.findMany({
      where: { userId: auth.id },
      skip: page.skip,
      take: page.take,
      orderBy: { createdAt: "desc" }
    });
    return paginated(notifications, page);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    const input = await parseJson(request, notificationSchema);
    const notification = await prisma.notification.create({
      data: {
        ...input,
        data: input.data as Prisma.InputJsonValue | undefined
      }
    });
    return ok({ notification }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

