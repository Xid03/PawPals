export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { prisma } from "@/server/prisma";
import { requireAuth } from "@/server/auth";
import { getPagination } from "@/server/pagination";
import { ok, paginated, handleRouteError } from "@/server/responses";
import { parseJson } from "@/server/route-utils";
import { commentSchema } from "@/server/validators";
import { addComment } from "@/server/services";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const page = getPagination(request.nextUrl.searchParams);
    const comments = await prisma.comment.findMany({
      where: { postId: params.id },
      skip: page.skip,
      take: page.take,
      include: { author: { select: { id: true, name: true, username: true, avatarUrl: true } } },
      orderBy: { createdAt: "asc" }
    });
    return paginated(comments, page);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(request);
    const input = await parseJson(request, commentSchema);
    const comment = await addComment(params.id, auth.id, input.text);
    return ok({ comment }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

