export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { ok, handleRouteError } from "@/server/responses";
import { rateLimit } from "@/server/rate-limit";
import { parseJson } from "@/server/route-utils";
import { registerSchema } from "@/server/validators";
import { registerUser } from "@/server/services";
import { signAuthToken, setAuthCookie } from "@/server/auth";

export async function POST(request: NextRequest) {
  try {
    rateLimit(request, "auth:register", { limit: 5, windowMs: 60_000 });
    const input = await parseJson(request, registerSchema);
    const user = await registerUser(input);
    const token = await signAuthToken(user);
    const response = ok({ user, token }, { status: 201 });
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}

