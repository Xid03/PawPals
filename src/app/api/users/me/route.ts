export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth";
import { ok, handleRouteError } from "@/server/responses";
import { parseJson } from "@/server/route-utils";
import { updateUserSchema } from "@/server/validators";
import { updateUserProfile } from "@/server/services";

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const input = await parseJson(request, updateUserSchema);
    const user = await updateUserProfile(auth.id, input);
    return ok({ user });
  } catch (error) {
    return handleRouteError(error);
  }
}

