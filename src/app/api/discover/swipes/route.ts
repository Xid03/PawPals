export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth";
import { ok, handleRouteError } from "@/server/responses";
import { rateLimit } from "@/server/rate-limit";
import { parseJson } from "@/server/route-utils";
import { swipeSchema } from "@/server/validators";
import { swipeCat } from "@/server/services";

export async function POST(request: NextRequest) {
  try {
    rateLimit(request, "discover:swipe", { limit: 80, windowMs: 60_000 });
    const auth = await requireAuth(request);
    const input = await parseJson(request, swipeSchema);
    const result = await swipeCat(auth.id, input.catId, input.action);
    return ok(result, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

