"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Heart, MapPin, PawPrint, Plus, Search, Sparkles, X } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { apiFetch, ageLabel, distanceLabel, requireSignedIn, type ApiCat } from "@/lib/api-client";
import profileIcon from "../../images/profileIcon.png";

const NEARBY_RADIUS_KM = 10;
const PAWPAL_RESULT_LIMIT = 50;
const malaysiaStates = [
  "Johor",
  "Kedah",
  "Kelantan",
  "Melaka",
  "Negeri Sembilan",
  "Pahang",
  "Penang",
  "Perak",
  "Perlis",
  "Sabah",
  "Sarawak",
  "Selangor",
  "Terengganu",
  "Kuala Lumpur",
  "Labuan",
  "Putrajaya"
];

type DisplayCat = {
  id: string;
  name: string;
  ageMonths: number;
  age: string;
  breed: string;
  gender?: string;
  city?: string | null;
  description?: string | null;
  ownerName?: string;
  ownerUsername?: string;
  lookingFor: string[];
  distanceKm?: number | null;
  distance: string;
  image: string;
};

function mapCat(cat: ApiCat): DisplayCat {
  return {
    id: cat.id,
    name: cat.name,
    ageMonths: cat.ageMonths,
    gender: cat.gender,
    city: cat.city,
    description: cat.description,
    ownerName: cat.owner?.name,
    ownerUsername: cat.owner?.username,
    lookingFor: cat.lookingFor ?? [],
    distanceKm: cat.distanceKm ?? null,
    breed: cat.breed,
    age: ageLabel(cat.ageMonths),
    distance: distanceLabel(cat),
    image: cat.photos?.[0]?.url ?? profileIcon.src
  };
}

type FilterItem = {
  label: string;
  icon: typeof MapPin;
};

const filters: FilterItem[] = [
  { label: "All", icon: PawPrint },
  { label: "Nearby", icon: MapPin }
];

export function DiscoverClient({ initialCats = [] }: { initialCats?: ApiCat[] }) {
  const router = useRouter();
  const [cats, setCats] = useState<DisplayCat[]>(() => initialCats.map(mapCat));
  const [index, setIndex] = useState(0);
  const [filter, setFilter] = useState("All");
  const [selectedState, setSelectedState] = useState("");
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [message, setMessage] = useState("Playdate-ready cats near you");
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [likedCatIds, setLikedCatIds] = useState<Set<string>>(() => new Set());
  const [skippedCatIds, setSkippedCatIds] = useState<Set<string>>(() => new Set());
  const [isSwiping, setIsSwiping] = useState(false);
  const [matchCount, setMatchCount] = useState<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  async function loadCats(query: string, nextMessage?: string, emptyMessage?: string) {
    try {
      const items = await apiFetch<ApiCat[]>(`/api/cats/nearby?${query}`);
      setCats(items.map(mapCat));
      setIndex(0);
      const exactNearby = items.some((item) => typeof item.distanceKm === "number" && item.distanceKm <= NEARBY_RADIUS_KM);
      if (!items.length) {
        setMessage(emptyMessage ?? (query.includes("strictRadius=true") ? "No PawPal profiles found within 10 km" : "No cat profiles uploaded yet"));
        return;
      }

      setMessage(nextMessage ?? (exactNearby ? "Showing PawPals within 10 km" : "Showing uploaded PawPals"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load PawPals right now.");
    }
  }

  useEffect(() => {
    function resetToAll() {
      setFilter("All");
      setSelectedState("");
      setShowStatePicker(false);
      setShowSearch(false);
      setSearchQuery("");
      setSkippedCatIds(new Set());
      setIndex(0);
      void loadCats(`limit=${PAWPAL_RESULT_LIMIT}`, "Showing all PawPal profiles.");
    }

    resetToAll();
    window.addEventListener("pageshow", resetToAll);
    return () => window.removeEventListener("pageshow", resetToAll);
  }, []);

  const filteredCats = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    return cats.filter((cat) => {
      const matchesSearch =
        !normalized ||
        [
          cat.name,
          cat.breed,
          cat.city ?? "",
          cat.description ?? "",
          ...cat.lookingFor
        ].some((value) => value?.toLowerCase().includes(normalized));
      return matchesSearch && !skippedCatIds.has(cat.id);
    });
  }, [cats, searchQuery, skippedCatIds]);

  useEffect(() => {
    setIndex(0);
  }, [searchQuery]);

  const cat = useMemo(() => (filteredCats.length ? filteredCats[index % filteredCats.length] : null), [filteredCats, index]);

  function openSearch() {
    setShowSearch((current) => !current);
    window.setTimeout(() => searchInputRef.current?.focus(), 0);
  }

  function applyFilter(label: string) {
    setFilter(label);
    if (label === "All") {
      setSelectedState("");
      setShowStatePicker(false);
      setShowSearch(false);
      setSearchQuery("");
      setSkippedCatIds(new Set());
      setIndex(0);
      void loadCats(`limit=${PAWPAL_RESULT_LIMIT}`, "Showing all PawPal profiles.");
      return;
    }

    if (label === "Nearby") {
      setSelectedState("");
      setShowStatePicker(false);
      if (!navigator.geolocation) {
        void loadCats(`limit=${PAWPAL_RESULT_LIMIT}`, "Location is unavailable, showing latest PawPals.");
        return;
      }
      setMessage("Finding PawPals near you...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          window.localStorage.setItem("pawpals_location", JSON.stringify({ lat: latitude, lng: longitude }));
          void loadCats(
            `lat=${encodeURIComponent(latitude)}&lng=${encodeURIComponent(longitude)}&radiusKm=${NEARBY_RADIUS_KM}&strictRadius=true&limit=${PAWPAL_RESULT_LIMIT}`,
            "Showing PawPals within 10 km"
          );
        },
        () => void loadCats(`limit=${PAWPAL_RESULT_LIMIT}`, "Location permission was not granted, showing latest PawPals."),
        { enableHighAccuracy: true, timeout: 8000 }
      );
      return;
    }
  }

  function applyStateFilter(state: string) {
    setFilter("State");
    setSelectedState(state);
    setShowStatePicker(false);
    setShowSearch(false);
    setSearchQuery("");
    setSkippedCatIds(new Set());
    setIndex(0);
    void loadCats(
      `city=${encodeURIComponent(state)}&limit=${PAWPAL_RESULT_LIMIT}`,
      `Showing PawPals in ${state}.`,
      `No PawPal profiles found in ${state}.`
    );
  }

  async function openMatches() {
    try {
      requireSignedIn();
      const matches = await apiFetch<unknown[]>("/api/discover/matches?limit=20");
      setMatchCount(matches.length);
      setMessage(matches.length ? `${matches.length} PawPal match${matches.length === 1 ? "" : "es"} found.` : "No PawPal matches yet. Keep swiping.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load matches.");
    }
  }

  async function swipe(action: "LIKE" | "SKIP") {
    if (!cat || isSwiping) return;
    setIsSwiping(true);
    try {
      requireSignedIn();
      const result = await apiFetch<{ match: unknown | null }>("/api/discover/swipes", {
        method: "POST",
        body: JSON.stringify({ catId: cat.id, action })
      });
      if (action === "LIKE") {
        setLikedCatIds((current) => new Set(current).add(cat.id));
      } else {
        setSkippedCatIds((current) => new Set(current).add(cat.id));
      }
      setMessage(result.match ? "It's a match! Send a meow." : action === "LIKE" ? "Paw sent!" : "Skipped");
      setIndex((current) => current + 1);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Swipe saved locally";
      if (errorMessage.toLowerCase().includes("already swiped")) {
        if (action === "LIKE") {
          setLikedCatIds((current) => new Set(current).add(cat.id));
        } else {
          setSkippedCatIds((current) => new Set(current).add(cat.id));
        }
        setIndex((current) => current + 1);
      }
      setMessage(errorMessage);
    } finally {
      setIsSwiping(false);
    }
  }

  return (
    <section className="min-h-screen bg-[#fff6ed] px-5 pb-28 pt-4">
      <header className="relative mb-4">
        <div>
          <h1 className="text-[27px] font-black leading-[1.05] text-paw-ink">Discover</h1>
          <h2 className="text-[40px] font-black leading-none text-paw-pink">
            PawPals <PawPrint size={24} className="inline -translate-y-1 fill-paw-pink/20" />
          </h2>
          <p className="mt-2 text-sm font-extrabold text-paw-cocoa/70">Find your new best friend <Heart size={13} className="inline fill-paw-pink text-paw-pink" /></p>
        </div>
        <button
          type="button"
          onClick={openSearch}
          className="absolute right-0 top-6 grid h-[58px] w-[58px] place-items-center rounded-full bg-white text-paw-ink shadow-[0_8px_22px_rgba(247,101,137,0.18)] ring-4 ring-paw-blush"
          aria-label="Search PawPals"
        >
          <Search size={27} strokeWidth={2.7} />
        </button>
      </header>

      {showSearch ? (
        <div className="mb-4 space-y-3">
          <label className="flex h-12 items-center gap-3 rounded-[18px] bg-white px-4 shadow-soft">
            <Search size={18} className="shrink-0 text-paw-cocoa" />
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search PawPals..."
              className="min-w-0 flex-1 bg-transparent text-sm font-black text-paw-ink outline-none placeholder:text-paw-cocoa/45"
            />
            {searchQuery ? (
              <button type="button" onClick={() => setSearchQuery("")} className="text-paw-pink" aria-label="Clear PawPals search">
                <X size={18} />
              </button>
            ) : null}
          </label>
        </div>
      ) : null}

      <div className="hide-scrollbar mb-5 flex gap-3 overflow-x-auto">
        <Link
          href="/upload-pawpal"
          className="relative mb-2 inline-flex h-12 shrink-0 items-center gap-2 rounded-[18px] bg-white/85 px-5 text-xs font-black text-paw-cocoa shadow-soft transition active:scale-95"
          aria-label="Upload PawPal"
        >
          <Plus size={15} className="text-paw-pink" />
          Upload PawPal
        </Link>
        {filters.map((item) => {
          const Icon = item.icon;
          const active = filter === item.label;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => applyFilter(item.label)}
              className={`relative mb-2 inline-flex h-12 shrink-0 items-center gap-2 rounded-[18px] px-5 text-xs font-black shadow-soft transition ${
                active ? "bg-paw-pink text-white" : "bg-white/85 text-paw-cocoa"
              }`}
            >
              <Icon size={15} className={active ? "text-white" : "text-paw-lavender"} />
              {item.label}
              {active ? <span className="absolute -bottom-2 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-paw-pink ring-4 ring-paw-blush" /> : null}
            </button>
          );
        })}
        <div className="mb-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowStatePicker((current) => !current)}
            className={`relative inline-flex h-12 items-center gap-2 rounded-[18px] px-5 text-xs font-black shadow-soft transition ${
              selectedState ? "bg-paw-pink text-white" : "bg-white/85 text-paw-cocoa"
            }`}
            aria-expanded={showStatePicker}
          >
            <MapPin size={15} className={selectedState ? "text-white" : "text-paw-lavender"} />
            {selectedState || "State"}
            <ChevronDown size={15} className={`transition ${showStatePicker ? "rotate-180" : ""}`} />
            {selectedState ? <span className="absolute -bottom-2 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-paw-pink ring-4 ring-paw-blush" /> : null}
          </button>
        </div>
      </div>

      {showStatePicker ? (
        <div className="mb-5 overflow-hidden rounded-[22px] border border-paw-peach/60 bg-[#fff8ee] p-2 shadow-[0_18px_34px_rgba(122,81,63,0.12)]">
          <div className="grid max-h-72 grid-cols-2 gap-1 overflow-y-auto pr-1">
            {malaysiaStates.map((state) => (
              <button
                key={state}
                type="button"
                onClick={() => applyStateFilter(state)}
                className={`flex min-h-11 items-center justify-between rounded-[16px] px-3 text-left text-xs font-black transition ${
                  selectedState === state ? "bg-paw-pink text-white" : "text-paw-cocoa hover:bg-paw-blush/55"
                }`}
              >
                <span className="min-w-0 truncate">{state}</span>
                {selectedState === state ? <PawPrint size={15} className="shrink-0 fill-white/20" /> : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        {cat ? (
          <div
            role="button"
            tabIndex={0}
            onClick={() => router.push(`/cats/${cat.id}`)}
            onKeyDown={(event) => {
              if (event.key === "Enter") router.push(`/cats/${cat.id}`);
            }}
            className="relative h-[395px] overflow-hidden rounded-[27px] bg-paw-blush shadow-[0_20px_34px_rgba(122,81,63,0.18)]"
          >
            <img src={cat.image} alt={cat.name} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                void swipe("LIKE");
              }}
              disabled={isSwiping}
              className={`absolute right-4 top-4 grid h-12 w-12 place-items-center rounded-full bg-white/95 shadow-soft ${
                likedCatIds.has(cat.id) ? "text-paw-pink" : "text-paw-cocoa"
              } disabled:opacity-70`}
              aria-label="Like cat"
              aria-pressed={likedCatIds.has(cat.id)}
            >
              <Heart size={24} className={likedCatIds.has(cat.id) ? "fill-paw-pink" : ""} />
            </button>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/62 via-black/28 to-transparent p-5 text-white">
              <h2 className="text-[31px] font-black leading-none">
                {cat.name} <PawPrint size={22} className="inline -translate-y-0.5 fill-paw-pink/30 text-paw-pink" />
              </h2>
              <div className="mt-3 inline-flex rounded-full border border-white/50 bg-white/15 px-3 py-1 text-xs font-black backdrop-blur">
                {cat.age} · {cat.breed}
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-xs font-bold">
                <span className="flex items-center gap-1">
                  <MapPin size={14} className="fill-white/20" />
                  {cat.distance}
                </span>
              <span className="rounded-full bg-black/35 px-3 py-1 font-black">{(index % filteredCats.length) + 1} / {filteredCats.length}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[27px] bg-white/85 p-8 text-center shadow-soft">
            <PawPrint className="mx-auto h-14 w-14 fill-paw-pink/20 text-paw-pink" />
            <h2 className="mt-4 text-2xl font-black text-paw-ink">
              {searchQuery ? "No PawPals found" : "No cats yet"}
            </h2>
            <p className="mt-2 text-sm font-bold text-paw-cocoa/70">
              {searchQuery ? "Try another cat name, breed, personality, bio, or location." : "Uploaded cat profiles will appear here."}
            </p>
          </div>
        )}

        <div className="mt-7 grid grid-cols-3 items-center gap-5 px-12">
          <button
            className="grid h-[62px] w-[62px] place-items-center rounded-full bg-paw-lavender text-white shadow-[0_10px_24px_rgba(171,116,224,0.35)]"
            type="button"
            onClick={() => void swipe("SKIP")}
            disabled={!cat || isSwiping}
            aria-label="Skip cat"
          >
            <X size={29} strokeWidth={3} />
          </button>
          <button
            className="mx-auto grid h-[86px] w-[86px] place-items-center rounded-full bg-white text-paw-rose shadow-[0_16px_28px_rgba(247,101,137,0.20)]"
            type="button"
            onClick={() => void openMatches()}
            aria-label="View PawPal matches"
          >
            <PawPrint className="fill-paw-pink/25" size={46} />
          </button>
          <button
            className="ml-auto grid h-[62px] w-[62px] place-items-center rounded-full bg-paw-pink text-white shadow-[0_10px_24px_rgba(247,101,137,0.35)]"
            type="button"
            onClick={() => void swipe("LIKE")}
            disabled={!cat || isSwiping}
            aria-label="Like cat"
          >
            <Heart className="fill-white" size={28} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            if (cat) router.push(`/cats/${cat.id}`);
            else if (matchCount !== null) void openMatches();
          }}
          className="mt-6 flex w-full items-center gap-3 rounded-[20px] bg-white/85 px-4 py-3 text-left shadow-soft transition active:scale-[0.99]"
        >
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-paw-blush text-paw-pink">
            <PawPrint className="fill-paw-pink/20" size={30} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-paw-ink">{message}</p>
            <p className="text-xs font-bold text-paw-cocoa/65">Showing real profiles uploaded by users</p>
          </div>
          <Sparkles size={28} className="shrink-0 text-paw-lavender" />
        </button>
      </div>
      <BottomNav />
    </section>
  );
}
