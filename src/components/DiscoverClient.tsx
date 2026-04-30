"use client";

import { useEffect, useMemo, useState } from "react";
import { Heart, PawPrint, Sparkles, X } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { CatCard, type DisplayCat } from "@/components/CatCard";
import { PageHeader } from "@/components/PageHeader";
import { TagChip } from "@/components/TagChip";
import { apiFetch, ageLabel, catImage, distanceLabel, requireSignedIn, type ApiCat } from "@/lib/api-client";
import { cats as mockCats } from "@/data/mockData";

function mapCat(cat: ApiCat): DisplayCat {
  return {
    id: cat.id,
    name: cat.name,
    gender: cat.gender,
    breed: cat.breed,
    age: ageLabel(cat.ageMonths),
    distance: distanceLabel(cat),
    image: catImage(cat, mockCats[0].image)
  };
}

export function DiscoverClient() {
  const [cats, setCats] = useState<DisplayCat[]>(mockCats);
  const [index, setIndex] = useState(0);
  const [filter, setFilter] = useState("Nearby");
  const [message, setMessage] = useState("Playdate-ready cats near you");

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const savedLocation = window.localStorage.getItem("pawpals_location");
    let query = "limit=20";

    if (lat && lng) {
      query = `lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&radiusKm=50&limit=20`;
      setMessage("Using your current location");
    } else if (savedLocation) {
      try {
        const location = JSON.parse(savedLocation) as { lat: number; lng: number };
        query = `lat=${encodeURIComponent(location.lat)}&lng=${encodeURIComponent(location.lng)}&radiusKm=50&limit=20`;
        setMessage("Using your saved location");
      } catch {
        window.localStorage.removeItem("pawpals_location");
      }
    }

    apiFetch<ApiCat[]>(`/api/cats/nearby?${query}`)
      .then((items) => {
        if (items.length) {
          setCats(items.map(mapCat));
          setIndex(0);
          const exactNearby = items.some((cat) => typeof cat.distanceKm === "number" && cat.distanceKm <= 50);
          setMessage(exactNearby ? "Nearest PawPals are sorted by distance" : "No close cats yet, showing nearest PawPals");
        }
      })
      .catch(() => undefined);
  }, []);

  const cat = useMemo(() => cats[index % cats.length], [cats, index]);

  async function swipe(action: "LIKE" | "SKIP") {
    if (!cat) return;
    try {
      requireSignedIn();
      const result = await apiFetch<{ match: unknown | null }>("/api/discover/swipes", {
        method: "POST",
        body: JSON.stringify({ catId: cat.id, action })
      });
      setMessage(result.match ? "It's a match! Send a meow." : action === "LIKE" ? "Paw sent!" : "Skipped");
      setIndex((current) => current + 1);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Swipe saved locally");
    }
  }

  return (
    <section className="min-h-screen bg-paw-radial pb-28">
      <PageHeader title="Discover PawPals" action="search" />
      <div className="hide-scrollbar mb-4 flex gap-2 overflow-x-auto px-5">
        {["Nearby", "Age", "Gender", "More Filters"].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setFilter(item);
              setMessage(`${item} filter selected`);
            }}
          >
            <TagChip active={filter === item}>{item}</TagChip>
          </button>
        ))}
      </div>
      <div className="px-5">
        {cat ? <CatCard cat={cat} large /> : null}
        <div className="mt-6 grid grid-cols-3 items-center gap-5 px-5">
          <button
            className="grid h-14 w-14 place-items-center rounded-full bg-paw-lavender text-white shadow-soft"
            type="button"
            onClick={() => swipe("SKIP")}
          >
            <X size={24} />
          </button>
          <button
            className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white text-paw-rose shadow-soft"
            type="button"
            onClick={() => swipe("LIKE")}
          >
            <PawPrint className="fill-paw-peach" size={38} />
          </button>
          <button
            className="ml-auto grid h-14 w-14 place-items-center rounded-full bg-paw-pink text-white shadow-soft"
            type="button"
            onClick={() => swipe("LIKE")}
          >
            <Heart className="fill-white" size={24} />
          </button>
        </div>
        <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-white/50 px-3 py-3 text-center text-xs font-black text-paw-cocoa">
          <Sparkles size={16} className="text-paw-lavender" />
          {message}
        </div>
      </div>
      <BottomNav />
    </section>
  );
}
