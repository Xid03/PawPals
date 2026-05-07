export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { prisma } from "@/server/prisma";
import { getTokenFromRequest, requireAuth, verifyAuthToken } from "@/server/auth";
import { ok, handleRouteError, ApiRouteError } from "@/server/responses";
import { parseJson } from "@/server/route-utils";
import { postSchema } from "@/server/validators";
import { ensurePostOwner, ensurePostVisible } from "@/server/services";

async function optionalAuthId(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) return null;

  try {
    return (await verifyAuthToken(token)).id;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authId = await optionalAuthId(request);
    await ensurePostVisible(params.id, authId);
    const post = await prisma.post.findUnique({
      where: { id: params.id },
      include: {
        author: { select: { id: true, name: true, username: true, avatarUrl: true, isPrivate: true } },
        images: true,
        comments: { include: { author: { select: { id: true, name: true, username: true, avatarUrl: true } } } },
        saves: authId ? { where: { userId: authId }, select: { id: true } } : false,
        _count: { select: { likes: true, comments: true, saves: true } }
      }
    });
    if (!post) throw new ApiRouteError(404, "NOT_FOUND", "Post not found");
    return ok({ post: { ...post, savedByMe: "saves" in post && Array.isArray(post.saves) ? post.saves.length > 0 : false } });
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

