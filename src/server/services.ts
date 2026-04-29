import type { Prisma } from "@prisma/client";
import { ApiRouteError } from "./responses";
import { orderedPair } from "./domain";
import { prisma } from "./prisma";
import { hashPassword, verifyPassword } from "./auth";
import { privateUser, publicUser } from "./serializers";

export async function registerUser(input: {
  name: string;
  username: string;
  email: string;
  password: string;
}) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: input.email }, { username: input.username }] }
  });

  if (existing) {
    throw new ApiRouteError(409, "CONFLICT", "Email or username is already in use");
  }

  const user = await prisma.user.create({
    data: {
      email: input.email,
      username: input.username,
      name: input.name,
      passwordHash: await hashPassword(input.password)
    }
  });

  return privateUser(user);
}

export async function loginUser(input: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user?.passwordHash || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new ApiRouteError(401, "UNAUTHORIZED", "Invalid email or password");
  }

  return privateUser(user);
}

export async function updateUserProfile(userId: string, data: Prisma.UserUpdateInput) {
  const user = await prisma.user.update({
    where: { id: userId },
    data
  });

  return privateUser(user);
}

export async function followUser(followerId: string, followingId: string) {
  if (followerId === followingId) {
    throw new ApiRouteError(400, "BAD_REQUEST", "You cannot follow yourself");
  }

  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId, followingId } },
    create: { followerId, followingId },
    update: {}
  });

  return { following: true };
}

export async function unfollowUser(followerId: string, followingId: string) {
  await prisma.follow.deleteMany({ where: { followerId, followingId } });
  return { following: false };
}

export async function ensureCatOwner(catId: string, ownerId: string) {
  const cat = await prisma.catProfile.findUnique({ where: { id: catId } });
  if (!cat) {
    throw new ApiRouteError(404, "NOT_FOUND", "Cat profile not found");
  }
  if (cat.ownerId !== ownerId) {
    throw new ApiRouteError(403, "FORBIDDEN", "You do not own this cat profile");
  }
  return cat;
}

export function catWhereFromQuery(query: {
  ageMin?: number;
  ageMax?: number;
  breed?: string;
  gender?: "MALE" | "FEMALE" | "UNKNOWN";
  city?: string;
  personality?: string;
  q?: string;
}) {
  const where: Prisma.CatProfileWhereInput = {};

  if (query.ageMin !== undefined || query.ageMax !== undefined) {
    where.ageMonths = {
      gte: query.ageMin,
      lte: query.ageMax
    };
  }
  if (query.breed) {
    where.breed = { contains: query.breed, mode: "insensitive" };
  }
  if (query.gender) {
    where.gender = query.gender;
  }
  if (query.city) {
    where.city = { contains: query.city, mode: "insensitive" };
  }
  if (query.personality) {
    where.personalityTags = { has: query.personality };
  }
  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" } },
      { breed: { contains: query.q, mode: "insensitive" } },
      { description: { contains: query.q, mode: "insensitive" } }
    ];
  }

  return where;
}

export async function swipeCat(userId: string, catId: string, action: "LIKE" | "SKIP") {
  const cat = await prisma.catProfile.findUnique({
    where: { id: catId },
    include: { owner: { select: { id: true } } }
  });

  if (!cat) {
    throw new ApiRouteError(404, "NOT_FOUND", "Cat profile not found");
  }

  if (cat.ownerId === userId) {
    throw new ApiRouteError(400, "BAD_REQUEST", "You cannot swipe on your own cat");
  }

  const swipe = await prisma.swipe.create({
    data: { userId, catId, action }
  }).catch((error) => {
    if (error.code === "P2002") {
      throw new ApiRouteError(409, "CONFLICT", "You already swiped on this cat");
    }
    throw error;
  });

  let match = null;
  if (action === "LIKE") {
    const myCats = await prisma.catProfile.findMany({
      where: { ownerId: userId },
      select: { id: true }
    });

    const reciprocal = await prisma.swipe.findFirst({
      where: {
        userId: cat.ownerId,
        action: "LIKE",
        catId: { in: myCats.map((item) => item.id) }
      }
    });

    if (reciprocal) {
      const [userAId, userBId] = orderedPair(userId, cat.ownerId);
      match = await prisma.match.upsert({
        where: { userAId_userBId: { userAId, userBId } },
        create: { userAId, userBId },
        update: {}
      });

      await prisma.notification.create({
        data: {
          userId: cat.ownerId,
          type: "NEW_MATCH",
          title: "New PawPal match",
          body: "A cat owner liked you back.",
          data: { matchId: match.id }
        }
      });
    }
  }

  return { swipe, match };
}

export async function ensurePostOwner(postId: string, userId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    throw new ApiRouteError(404, "NOT_FOUND", "Post not found");
  }
  if (post.authorId !== userId) {
    throw new ApiRouteError(403, "FORBIDDEN", "You do not own this post");
  }
  return post;
}

export async function togglePostLike(postId: string, userId: string) {
  const existing = await prisma.like.findUnique({
    where: { postId_userId: { postId, userId } }
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    return { liked: false };
  }

  const like = await prisma.like.create({ data: { postId, userId } });
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
  if (post && post.authorId !== userId) {
    await prisma.notification.create({
      data: {
        userId: post.authorId,
        type: "POST_LIKE",
        title: "New like",
        body: "Someone liked your post.",
        data: { postId }
      }
    });
  }

  return { liked: true, like };
}

export async function toggleSavedPost(postId: string, userId: string) {
  const existing = await prisma.savedPost.findUnique({
    where: { postId_userId: { postId, userId } }
  });

  if (existing) {
    await prisma.savedPost.delete({ where: { id: existing.id } });
    return { saved: false };
  }

  await prisma.savedPost.create({ data: { postId, userId } });
  return { saved: true };
}

export async function addComment(postId: string, authorId: string, text: string) {
  const comment = await prisma.comment.create({
    data: { postId, authorId, text },
    include: { author: true }
  });

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
  if (post && post.authorId !== authorId) {
    await prisma.notification.create({
      data: {
        userId: post.authorId,
        type: "POST_COMMENT",
        title: "New comment",
        body: "Someone commented on your post.",
        data: { postId, commentId: comment.id }
      }
    });
  }

  return comment;
}

export async function ensureConversationParticipant(conversationId: string, userId: string) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } }
  });

  if (!participant) {
    throw new ApiRouteError(403, "FORBIDDEN", "You are not part of this conversation");
  }

  return participant;
}

export async function getOrCreateConversation(userId: string, otherUserId: string) {
  if (userId === otherUserId) {
    throw new ApiRouteError(400, "BAD_REQUEST", "Cannot create a conversation with yourself");
  }

  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId } } },
        { participants: { some: { userId: otherUserId } } }
      ]
    },
    include: { participants: { include: { user: true } }, messages: { take: 1, orderBy: { createdAt: "desc" } } }
  });

  if (existing) {
    return existing;
  }

  return prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId }, { userId: otherUserId }]
      }
    },
    include: { participants: { include: { user: true } }, messages: true }
  });
}

export async function toggleFavoriteVet(vetId: string, userId: string) {
  const existing = await prisma.favoriteVet.findUnique({
    where: { vetId_userId: { vetId, userId } }
  });

  if (existing) {
    await prisma.favoriteVet.delete({ where: { id: existing.id } });
    return { favorite: false };
  }

  await prisma.favoriteVet.create({ data: { vetId, userId } });
  return { favorite: true };
}

export async function toggleEventRsvp(eventId: string, userId: string, active: boolean) {
  if (!active) {
    await prisma.eventRSVP.deleteMany({ where: { eventId, userId } });
    return { rsvped: false };
  }

  await prisma.eventRSVP.upsert({
    where: { eventId_userId: { eventId, userId } },
    create: { eventId, userId },
    update: {}
  });

  return { rsvped: true };
}

export async function toggleSavedEvent(eventId: string, userId: string) {
  const existing = await prisma.savedEvent.findUnique({
    where: { eventId_userId: { eventId, userId } }
  });
  if (existing) {
    await prisma.savedEvent.delete({ where: { id: existing.id } });
    return { saved: false };
  }
  await prisma.savedEvent.create({ data: { eventId, userId } });
  return { saved: true };
}

export async function toggleSavedHealthTip(healthTipId: string, userId: string) {
  const existing = await prisma.savedHealthTip.findUnique({
    where: { healthTipId_userId: { healthTipId, userId } }
  });
  if (existing) {
    await prisma.savedHealthTip.delete({ where: { id: existing.id } });
    return { saved: false };
  }
  await prisma.savedHealthTip.create({ data: { healthTipId, userId } });
  return { saved: true };
}

export { publicUser };
