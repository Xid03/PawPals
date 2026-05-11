import { DiscoverClient } from "@/components/DiscoverClient";
import type { ApiCat } from "@/lib/api-client";
import { getCurrentUserFromCookie } from "@/server/current-user";
import { prisma } from "@/server/prisma";

export const dynamic = "force-dynamic";

async function getInitialCats(currentUserId?: string): Promise<ApiCat[]> {
  try {
    const cats = await prisma.catProfile.findMany({
      where: {
        ...(currentUserId ? { ownerId: { not: currentUserId } } : {}),
        NOT: {
          owner: { email: { endsWith: "@pawpals.test" } }
        }
      },
      take: 20,
      include: {
        photos: { select: { url: true } },
        owner: { select: { id: true, name: true, username: true, avatarUrl: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    return cats.map((cat) => ({
      id: cat.id,
      name: cat.name,
      ageMonths: cat.ageMonths,
      gender: cat.gender,
      breed: cat.breed,
      personalityTags: cat.personalityTags,
      lookingFor: cat.lookingFor,
      city: cat.city,
      description: cat.description,
      photos: cat.photos,
      owner: cat.owner
    }));
  } catch {
    return [];
  }
}

export default async function DiscoverPage() {
  const currentUser = await getCurrentUserFromCookie();
  const initialCats = await getInitialCats(currentUser?.id);
  return <DiscoverClient initialCats={initialCats} />;
}
