export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { prisma } from "@/server/prisma";
import { requireAuth } from "@/server/auth";
import { ok, handleRouteError, ApiRouteError } from "@/server/responses";
import { parseJson } from "@/server/route-utils";
import { postSchema } from "@/server/validators";
import { ensurePostOwner } from "@/server/services";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const post = await prisma.post.findUnique({
      where: { id: params.id },
      include: {
        author: { select: { id: true, name: true, username: true, avatarUrl: true } },
        images: true,
        comments: { include: { author: { select: { id: true, name: true, username: true, avatarUrl: true } } } },
        _count: { select: { likes: true, comments: true, saves: true } }
      }
    });
    if (!post) throw new ApiRouteError(404, "NOT_FOUND", "Post not found");
    return ok({ post });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(request);
    await ensurePostOwner(params.id, auth.id);
    const input = await parseJson(request, postSchema.partial());
    const post = await prisma.post.update({
      where: { id: params.id },
      data: { text: input.text, topic: input.topic },
      include: { images: true }
    });
    return ok({ post });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(request);
    await ensurePostOwner(params.id, auth.id);
    await prisma.post.delete({ where: { id: params.id } });
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

