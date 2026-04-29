export const dynamic = "force-dynamic";

import { prisma } from "@/server/prisma";
import { ok, handleRouteError } from "@/server/responses";

export async function GET() {
  try {
    const tip =
      (await prisma.healthTip.findFirst({
        where: { isDaily: true },
        orderBy: { publishedAt: "desc" }
      })) ??
      (await prisma.healthTip.findFirst({
        orderBy: { publishedAt: "desc" }
      }));
    return ok({ tip });
  } catch (error) {
    return handleRouteError(error);
  }
}

