"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, PawPrint } from "lucide-react";
import { StatusToast } from "@/components/StatusToast";
import { TagChip } from "@/components/TagChip";
import { apiFetch, ageLabel, catImage, requireSignedIn, type ApiCat } from "@/lib/api-client";
import profileIcon from "../../images/profileIcon.png";

export function CatProfileClient({ id }: { id: string }) {
  const [cat, setCat] = useState<ApiCat | null>(null);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    apiFetch<{ cat: ApiCat }>(`/api/cats/${id}`)
      .then((data) => setCat(data.cat))
      .catch((error) => setStatus(error instanceof Error ? error.message : "Could not load PawPal profile."))
      .finally(() => setIsLoading(false));
  }, [id]);

  const display = {
    name: cat?.name ?? "PawPal",
    image: cat ? catImage(cat, profileIcon.src) : profileIcon.src,
    age: cat ? ageLabel(cat.ageMonths) : "",
    breed: cat?.breed ?? "",
    gender: cat?.gender ?? "",
    distance: cat?.city ?? "Malaysia",
    about: cat?.description ?? "No bio added yet.",
    personality: cat?.personalityTags ?? [],
    lookingFor: cat?.lookingFor ?? [],
    ownerId: cat?.owner?.id,
    ownerName: cat?.owner?.name,
    ownerUsername: cat?.owner?.username,
    ownerAvatar: cat?.owner?.avatarUrl
  };

  if (isLoading) {
    return (
      <section className="min-h-screen bg-paw-cream pb-7">
        <div className="relative h-[420px] overflow-hidden rounded-b-[2rem] bg-paw-blush/70">
          <Link href="/discover" className="absolute left-5 top-6 grid h-10 w-10 place-items-center rounded-full bg-white/70 text-paw-ink" aria-label="Go back">
            <ArrowLeft size={20} />
          </Link>
          <div className="absolute inset-x-6 bottom-8 space-y-3">
            <div className="h-9 w-36 animate-pulse rounded-full bg-white/55" />
            <div className="h-4 w-56 animate-pulse rounded-full bg-white/45" />
            <div className="h-4 w-28 animate-pulse rounded-full bg-white/40" />
          </div>
        </div>
        <div className="space-y-5 px-5 pt-5">
          <StatusToast message={status} onDismiss={() => setStatus("")} />
          <div className="h-5 w-28 animate-pulse rounded-full bg-paw-blush" />
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded-full bg-paw-blush/80" />
            <div className="h-4 w-4/5 animate-pulse rounded-full bg-paw-blush/70" />
          </div>
          <div className="h-5 w-24 animate-pulse rounded-full bg-paw-blush" />
          <div className="flex gap-2">
            <div className="h-9 w-20 animate-pulse rounded-full bg-paw-blush/80" />
            <div className="h-9 w-24 animate-pulse rounded-full bg-paw-blush/70" />
          </div>
          <div className="h-12 w-full animate-pulse rounded-2xl bg-paw-rose/35" />
        </div>
      </section>
    );
  }

  if (!cat) {
    return (
      <section className="min-h-screen bg-paw-cream px-5 pb-7 pt-6">
        <StatusToast message={status} onDismiss={() => setStatus("")} />
        <Link href="/discover" className="grid h-10 w-10 place-items-center rounded-full bg-white/70 text-paw-ink" aria-label="Go back">
          <ArrowLeft size={20} />
        </Link>
        <div className="mt-20 rounded-[28px] bg-white/80 p-6 text-center shadow-soft">
          <PawPrint className="mx-auto h-12 w-12 fill-paw-pink/20 text-paw-pink" />
          <h1 className="mt-4 text-2xl font-black text-paw-ink">PawPal not found</h1>
          <p className="mt-2 text-sm font-bold text-paw-cocoa/70">This profile may have been removed.</p>
        </div>
      </section>
    );
  }

  async function sendMeow() {
    if (!display.ownerId) {
      setStatus("This PawPal profile is missing owner information.");
      return;
    }

    try {
      requireSignedIn();
      const data = await apiFetch<{ conversation: { id: string } }>("/api/conversations", {
        method: "POST",
        body: JSON.stringify({ userId: display.ownerId })
      });
      window.location.href = `/chats?conversationId=${encodeURIComponent(data.conversation.id)}`;
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
        <div className="absolute bottom-6 left-6 text-white">
          <h1 className="text-3xl font-black">{display.name}</h1>
          <p className="text-sm font-extrabold">
            {display.age} - {display.breed} - {display.gender}
          </p>
          <p className="mt-1 text-sm font-bold">{display.distance}</p>
          {display.ownerId && display.ownerUsername ? (
            <Link
              href={`/users/${display.ownerId}`}
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/18 px-3 py-1.5 text-xs font-black text-white backdrop-blur transition hover:bg-white/28"
              onClick={(event) => event.stopPropagation()}
            >
              <img src={display.ownerAvatar || profileIcon.src} alt={display.ownerUsername} className="h-6 w-6 rounded-full object-cover ring-2 ring-white/70" />
              Uploaded by @{display.ownerUsername}
            </Link>
          ) : null}
        </div>
      </div>

      <div className="space-y-5 px-5 pt-5">
        <StatusToast message={status} onDismiss={() => setStatus("")} />
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
