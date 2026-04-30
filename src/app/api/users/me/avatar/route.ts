export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth";
import { ok, handleRouteError, ApiRouteError } from "@/server/responses";
import { isUploadFile, saveUpload } from "@/server/upload";
import { updateUserProfile } from "@/server/services";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const formData = await request.formData();
    const file = formData.get("file");
    if (!isUploadFile(file)) {
      throw new ApiRouteError(400, "BAD_REQUEST", "Missing file");
    }
    const avatarUrl = await saveUpload(file, "avatars");
    const user = await updateUserProfile(auth.id, { avatarUrl });
    return ok({ user, avatarUrl }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

