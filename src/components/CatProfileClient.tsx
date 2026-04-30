"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MoreHorizontal, PawPrint } from "lucide-react";
import { TagChip } from "@/components/TagChip";
import { apiFetch, ageLabel, catImage, requireSignedIn, type ApiCat } from "@/lib/api-client";
import { cats as mockCats } from "@/data/mockData";

export function CatProfileClient({ id }: { id: string }) {
  const fallback = mockCats.find((item) => item.id === id) ?? mockCats[0];
  const [cat, setCat] = useState<ApiCat | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    apiFetch<{ cat: ApiCat }>(`/api/cats/${id}`)
      .then((data) => setCat(data.cat))
      .catch(() => undefined);
  }, [id]);

  const display = {
    name: cat?.name ?? fallback.name,
    image: cat ? catImage(cat, fallback.image) : fallback.image,
    age: cat ? ageLabel(cat.ageMonths) : fallback.age,
    breed: cat?.breed ?? fallback.breed,
    gender: cat?.gender ?? fallback.gender,
    distance: cat?.city ?? fallback.distance,
    about: cat?.description ?? fallback.about,
    personality: cat?.personalityTags ?? fallback.personality,
    lookingFor: cat?.lookingFor ?? fallback.lookingFor,
    ownerId: cat?.owner?.id
  };

  async function sendMeow() {
    if (!display.ownerId) {
      setStatus("Open a seeded API cat to create a real conversation.");
      return;
    }

    try {
      requireSignedIn();
      await apiFetch("/api/conversations", {
        method: "POST",
        body: JSON.stringify({ userId: display.ownerId })
      });
      window.location.href = "/chats";
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not start chat");
    }
  }

  return (
    <section className="min-h-screen bg-paw-cream pb-7">
      <div className="relative h-[420px] overflow-hidden rounded-b-[2rem]">
        <img src={display.image} alt={display.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-paw-ink/70 via-transparent to-paw-ink/10" />
        <Link href="/discover" className="absolute left-5 top-6 grid h-10 w-10 place-items-center rounded-full bg-white/70 text-paw-ink" aria-label="Go back">
          <ArrowLeft size={20} />
        </Link>
        <button
          className="absolute right-5 top-6 grid h-10 w-10 place-items-center rounded-full bg-white/70"
          type="button"
          onClick={() => {
            try {
              requireSignedIn();
              setStatus("Cat profile options will appear here.");
            } catch (error) {
              setStatus(error instanceof Error ? error.message : "Please log in to use this feature.");
            }
          }}
          aria-label="Cat profile options"
        >
          <MoreHorizontal size={20} />
        </button>
        <div className="absolute bottom-6 left-6 text-white">
          <h1 className="text-3xl font-black">{display.name}</h1>
          <p className="text-sm font-extrabold">
            {display.age} - {display.breed} - {display.gender}
          </p>
          <p className="mt-1 text-sm font-bold">{display.distance}</p>
        </div>
      </div>

      <div className="space-y-5 px-5 pt-5">
        {status ? <p className="text-xs font-extrabold text-paw-pink">{status}</p> : null}
        <section>
          <h2 className="mb-2 text-sm font-black">About {display.name}</h2>
          <p className="text-sm font-bold leading-relaxed text-paw-cocoa">{display.about}</p>
        </section>
        <section>
          <h2 className="mb-2 text-sm font-black">Personality</h2>
          <div className="flex flex-wrap gap-2">
            {display.personality.map((tag) => (
              <TagChip key={tag} tone="lavender">
                {tag}
              </TagChip>
            ))}
          </div>
        </section>
        <section>
          <h2 className="mb-2 text-sm font-black">Looking for</h2>
          <div className="flex flex-wrap gap-2">
            {display.lookingFor.map((tag) => (
              <TagChip key={tag} tone="peach">
                {tag}
              </TagChip>
            ))}
          </div>
        </section>
        <button
          type="button"
          onClick={sendMeow}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-paw-pink to-paw-rose px-5 py-3 text-sm font-extrabold text-white shadow-soft"
        >
          Send Meow <PawPrint size={20} />
        </button>
      </div>
    </section>
  );
}
