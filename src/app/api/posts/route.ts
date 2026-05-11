export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { prisma } from "@/server/prisma";
import { getTokenFromRequest, requireAuth, verifyAuthToken } from "@/server/auth";
import { getPagination } from "@/server/pagination";
import { ok, paginated, handleRouteError } from "@/server/responses";
import { parseJson, queryObject } from "@/server/route-utils";
import { postSchema } from "@/server/validators";
import { ensureCanViewUserPrivateContent } from "@/server/services";
import { z } from "zod";

const postQuerySchema = z.object({
  topic: z.enum(["HEALTH", "BEHAVIOR", "FOOD", "GENERAL", "MEMES"]).optional(),
  authorId: z.string().optional(),
  q: z.string().optional()
});

async function optionalAuthId(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) return null;

  try {
    return (await verifyAuthToken(token)).id;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const authId = await optionalAuthId(request);
    const page = getPagination(request.nextUrl.searchParams);
    const query = postQuerySchema.parse(queryObject(request));
    if (query.authorId) {
      await ensureCanViewUserPrivateContent(authId, query.authorId);
    }
    const where = {
      ...(query.topic ? { topic: query.topic } : {}),
      ...(query.q?.trim()
        ? {
            OR: [
              { text: { contains: query.q.trim(), mode: "insensitive" as const } },
              { topic: { equals: query.q.trim().toUpperCase() as never } },
              { author: { name: { contains: query.q.trim(), mode: "insensitive" as const } } },
              { author: { username: { contains: query.q.trim().replace(/^@/, ""), mode: "insensitive" as const } } }
            ]
          }
        : {}),
      ...(query.authorId
        ? { authorId: query.authorId }
        : {
            author: {
              OR: [
                { isPrivate: false },
                ...(authId ? [{ id: authId }, { followers: { some: { followerId: authId } } }] : [])
              ]
            }
          })
    };
    const posts = await prisma.post.findMany({
      where,
      skip: page.skip,
      take: page.take,
      include: {
        author: { select: { id: true, name: true, username: true, avatarUrl: true, isPrivate: true } },
        images: true,
        likes: authId ? { where: { userId: authId }, select: { id: true } } : false,
        saves: authId ? { where: { userId: authId }, select: { id: true } } : false,
        _count: { select: { likes: true, comments: true, saves: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    return paginated(
      posts.map((post) => ({
        ...post,
        likedByMe: "likes" in post && Array.isArray(post.likes) ? post.likes.length > 0 : false,
        savedByMe: "saves" in post && Array.isArray(post.saves) ? post.saves.length > 0 : false
      })),
      page
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const input = await parseJson(request, postSchema);
    const post = await prisma.post.create({
      data: {
        authorId: auth.id,
        text: input.text,
        topic: input.topic,
        images: { create: input.mediaUrls.map((url) => ({ url })) }
      },
      include: { images: true }
    });
    return ok({ post }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

