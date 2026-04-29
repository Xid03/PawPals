export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth";
import { ok, handleRouteError, ApiRouteError } from "@/server/responses";
import { saveUpload } from "@/server/upload";

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = String(formData.get("folder") ?? "media");
    if (!(file instanceof File)) {
      throw new ApiRouteError(400, "BAD_REQUEST", "Missing file");
    }
    const url = await saveUpload(file, folder);
    return ok({ url }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

