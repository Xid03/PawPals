export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/prisma";
import { requireAuth } from "@/server/auth";
import { getPagination } from "@/server/pagination";
import { ok, paginated, handleRouteError } from "@/server/responses";
import { parseJson } from "@/server/route-utils";
import { notificationSchema } from "@/server/validators";

function jsonObject(value: Prisma.JsonValue | null) {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const page = getPagination(request.nextUrl.searchParams);
    const notifications = await prisma.notification.findMany({
      where: { userId: auth.id },
      skip: page.skip,
      take: page.take,
      orderBy: { createdAt: "desc" }
    });

    const requesterIds = Array.from(
      new Set(
        notifications
          .filter((notification) => notification.type === "FOLLOW_REQUEST")
          .map((notification) => jsonObject(notification.data).requesterId)
          .filter((id): id is string => typeof id === "string")
      )
    );
    const [requesters, pendingFollowRequests] = requesterIds.length
      ? await Promise.all([
          prisma.user.findMany({
            where: { id: { in: requesterIds } },
            select: { id: true, name: true, username: true, avatarUrl: true }
          }),
          prisma.followRequest.findMany({
            where: { targetId: auth.id, requesterId: { in: requesterIds }, status: "PENDING" },
            select: { id: true, requesterId: true }
          })
        ])
      : [[], []];
    const followerIds = Array.from(
      new Set(
        notifications
          .filter((notification) => notification.type === "NEW_FOLLOWER")
          .map((notification) => jsonObject(notification.data).followerId)
          .filter((id): id is string => typeof id === "string")
      )
    );
    const [followBacks, pendingFollowBackRequests] = followerIds.length
      ? await Promise.all([
          prisma.follow.findMany({
            where: { followerId: auth.id, followingId: { in: followerIds } },
            select: { followingId: true }
          }),
          prisma.followRequest.findMany({
            where: { requesterId: auth.id, targetId: { in: followerIds }, status: "PENDING" },
            select: { targetId: true }
          })
        ])
      : [[], []];
    const requesterById = new Map(requesters.map((user) => [user.id, user]));
    const pendingRequestByRequesterId = new Map(pendingFollowRequests.map((request) => [request.requesterId, request]));
    const followedBackUserIds = new Set(followBacks.map((follow) => follow.followingId));
    const requestedFollowBackUserIds = new Set(pendingFollowBackRequests.map((request) => request.targetId));
    const enrichedNotifications = notifications.map((notification) => {
      if (notification.type === "NEW_FOLLOWER") {
        const data = jsonObject(notification.data);
        const followerId = typeof data.followerId === "string" ? data.followerId : "";
        const existingStatus = data.followBackStatus === "following" || data.followBackStatus === "requested" ? data.followBackStatus : null;
        const followBackStatus = followedBackUserIds.has(followerId)
          ? "following"
          : requestedFollowBackUserIds.has(followerId)
            ? "requested"
            : existingStatus;

        return {
          ...notification,
          data: {
            ...data,
            followBackStatus
          }
        };
      }

      if (notification.type !== "FOLLOW_REQUEST") return notification;

      const data = jsonObject(notification.data);
      const requesterId = typeof data.requesterId === "string" ? data.requesterId : "";
      const requester = requesterById.get(requesterId);
      const pendingRequest = pendingRequestByRequesterId.get(requesterId);
      const requesterUsername =
        typeof data.requesterUsername === "string" ? data.requesterUsername : requester?.username;
      const requesterName = typeof data.requesterName === "string" ? data.requesterName : requester?.name;
      const requesterLabel = requesterUsername ? `@${requesterUsername}` : requesterName ?? "Someone";

      return {
        ...notification,
        body: `${requesterLabel} requested to follow your private account.`,
        data: {
          ...data,
          followRequestId: typeof data.followRequestId === "string" ? data.followRequestId : pendingRequest?.id ?? null,
          requesterUsername: requesterUsername ?? null,
          requesterName: requesterName ?? null
        },
        requester
      };
    });

    return paginated(enrichedNotifications, page);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    const input = await parseJson(request, notificationSchema);
    const notification = await prisma.notification.create({
      data: {
        ...input,
        data: input.data as Prisma.InputJsonValue | undefined
      }
    });
    return ok({ notification }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

