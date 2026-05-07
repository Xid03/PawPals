export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth";
import { ok, handleRouteError } from "@/server/responses";
import { approveFollowRequest } from "@/server/services";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(request);
    return ok(await approveFollowRequest(auth.id, params.id));
  } catch (error) {
    return handleRouteError(error);
  }
}
