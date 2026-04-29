export const dynamic = "force-dynamic";

import { ok, handleRouteError } from "@/server/responses";
import { clearAuthCookie } from "@/server/auth";

export async function POST() {
  try {
    clearAuthCookie();
    return ok({ loggedOut: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

