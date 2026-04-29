export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { ok, handleRouteError } from "@/server/responses";
import { rateLimit } from "@/server/rate-limit";
import { parseJson } from "@/server/route-utils";
import { loginSchema } from "@/server/validators";
import { loginUser } from "@/server/services";
import { signAuthToken, setAuthCookie } from "@/server/auth";

export async function POST(request: NextRequest) {
  try {
    rateLimit(request, "auth:login", { limit: 8, windowMs: 60_000 });
    const input = await parseJson(request, loginSchema);
    const user = await loginUser(input);
    const token = await signAuthToken(user);
    const response = ok({ user, token });
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}

