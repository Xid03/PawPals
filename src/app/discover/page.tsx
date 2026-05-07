import { DiscoverClient } from "@/components/DiscoverClient";
import type { ApiCat } from "@/lib/api-client";
import { prisma } from "@/server/prisma";

export const dynamic = "force-dynamic";

async function getInitialCats(): Promise<ApiCat[]> {
  try {
    const cats = await prisma.catProfile.findMany({
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
  const initialCats = await getInitialCats();
  return <DiscoverClient initialCats={initialCats} />;
}
