export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth";
import { ok, handleRouteError } from "@/server/responses";
import { toggleEventRsvp } from "@/server/services";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(request);
    return ok(await toggleEventRsvp(params.id, auth.id, true));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(request);
    return ok(await toggleEventRsvp(params.id, auth.id, false));
  } catch (error) {
    return handleRouteError(error);
  }
}

