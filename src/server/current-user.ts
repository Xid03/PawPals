import { cookies } from "next/headers";
import type { PublicUser } from "@/lib/api-client";
import { verifyAuthToken } from "@/server/auth";
import { prisma } from "@/server/prisma";

export async function getCurrentUserFromCookie(): Promise<PublicUser | null> {
  try {
    const token = cookies().get("pawpals_token")?.value;
    if (!token) return null;

    const auth = await verifyAuthToken(token);
    return await prisma.user.findUnique({
      where: { id: auth.id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        bio: true,
        avatarUrl: true,
        city: true,
        isPrivate: true
      }
    });
  } catch {
    return null;
  }
}
