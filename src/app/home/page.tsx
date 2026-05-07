import { HomeClient } from "@/components/HomeClient";
import type { ApiPost, PublicUser } from "@/lib/api-client";
import { getCurrentUserFromCookie } from "@/server/current-user";
import { prisma } from "@/server/prisma";

export const dynamic = "force-dynamic";

async function getInitialPosts(): Promise<ApiPost[]> {
  try {
    const posts = await prisma.post.findMany({
      take: 1,
      include: {
        author: { select: { id: true, name: true, username: true, avatarUrl: true } },
        images: true,
        _count: { select: { likes: true, comments: true, saves: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    return posts.map((post) => ({
      id: post.id,
      text: post.text,
      topic: post.topic,
      createdAt: post.createdAt.toISOString(),
      author: post.author,
      images: post.images.map((image) => ({ url: image.url })),
      _count: post._count
    }));
  } catch {
    return [];
  }
}

async function getInitialUser(): Promise<PublicUser | null> {
  return getCurrentUserFromCookie();
}

export default async function HomePage() {
  const [initialPosts, initialUser] = await Promise.all([getInitialPosts(), getInitialUser()]);
  return <HomeClient initialPosts={initialPosts} initialUser={initialUser} />;
}
