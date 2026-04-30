export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { prisma } from "@/server/prisma";
import { requireAuth } from "@/server/auth";
import { ok, handleRouteError, ApiRouteError } from "@/server/responses";
import { ensureCatOwner } from "@/server/services";
import { isUploadFile, saveUpload } from "@/server/upload";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(request);
    await ensureCatOwner(params.id, auth.id);
    const formData = await request.formData();
    const file = formData.get("file");
    if (!isUploadFile(file)) {
      throw new ApiRouteError(400, "BAD_REQUEST", "Missing file");
    }
    const url = await saveUpload(file, "cats");
    const photo = await prisma.catPhoto.create({ data: { catId: params.id, url } });
    return ok({ photo }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

