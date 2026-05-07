export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { prisma } from "@/server/prisma";
import { requireAuth } from "@/server/auth";
import { getPagination } from "@/server/pagination";
import { ok, paginated, handleRouteError } from "@/server/responses";
import { parseJson, queryObject } from "@/server/route-utils";
import { storySchema } from "@/server/validators";
import { z } from "zod";

const storyQuerySchema = z.object({
  authorId: z.string().optional(),
  mine: z.enum(["true", "false"]).optional()
});

export async function GET(request: NextRequest) {
  try {
    const page = getPagination(request.nextUrl.searchParams);
    const query = storyQuerySchema.parse(queryObject(request));
    const auth = query.mine === "true" ? await requireAuth(request) : null;
    const authorId = auth?.id ?? query.authorId;
    const stories = await prisma.story.findMany({
      where: {
        expiresAt: { gt: new Date() },
        ...(authorId ? { authorId } : {})
      },
      skip: page.skip,
      take: page.take,
      include: { author: { select: { id: true, name: true, username: true, avatarUrl: true } }, _count: { select: { likes: true, views: true } } },
      orderBy: { createdAt: "desc" }
    });
    return paginated(stories, page);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const input = await parseJson(request, storySchema);
    const story = await prisma.story.create({
      data: {
        authorId: auth.id,
        url: input.url,
        type: input.type,
        caption: input.caption,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      },
      include: { author: { select: { id: true, name: true, username: true, avatarUrl: true } }, _count: { select: { likes: true, views: true } } }
    });
    return ok({ story }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

