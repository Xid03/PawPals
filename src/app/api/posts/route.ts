export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { prisma } from "@/server/prisma";
import { requireAuth } from "@/server/auth";
import { getPagination } from "@/server/pagination";
import { ok, paginated, handleRouteError } from "@/server/responses";
import { parseJson, queryObject } from "@/server/route-utils";
import { postSchema } from "@/server/validators";
import { z } from "zod";

const postQuerySchema = z.object({
  topic: z.enum(["HEALTH", "BEHAVIOR", "FOOD", "GENERAL", "MEMES"]).optional(),
  authorId: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const page = getPagination(request.nextUrl.searchParams);
    const query = postQuerySchema.parse(queryObject(request));
    const where = {
      ...(query.topic ? { topic: query.topic } : {}),
      ...(query.authorId ? { authorId: query.authorId } : {})
    };
    const posts = await prisma.post.findMany({
      where,
      skip: page.skip,
      take: page.take,
      include: {
        author: { select: { id: true, name: true, username: true, avatarUrl: true } },
        images: true,
        _count: { select: { likes: true, comments: true, saves: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    return paginated(posts, page);
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

