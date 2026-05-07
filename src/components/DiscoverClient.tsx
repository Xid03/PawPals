"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Calendar, Heart, MapPin, PawPrint, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { apiFetch, ageLabel, distanceLabel, requireSignedIn, type ApiCat, type PublicUser } from "@/lib/api-client";
import discoverCat1 from "../../images/discoverCat1.png";
import profileIcon from "../../images/profileIcon.png";

type DisplayCat = {
  id: string;
  name: string;
  age: string;
  breed: string;
  gender?: string;
  distance: string;
  image: string;
};

function mapCat(cat: ApiCat): DisplayCat {
  return {
    id: cat.id,
    name: cat.name,
    gender: cat.gender,
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
  { label: "Nearby", icon: MapPin },
  { label: "Age", icon: Calendar },
  { label: "Gender", icon: PawPrint },
  { label: "More Filters", icon: SlidersHorizontal }
];

export function DiscoverClient({ initialCats = [] }: { initialCats?: ApiCat[] }) {
  const [cats, setCats] = useState<DisplayCat[]>(() => initialCats.map(mapCat));
  const [index, setIndex] = useState(0);
  const [filter, setFilter] = useState("Nearby");
  const [message, setMessage] = useState("Playdate-ready cats near you");
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userResults, setUserResults] = useState<PublicUser[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
        setCats(items.map(mapCat));
        setIndex(0);
        const exactNearby = items.some((cat) => typeof cat.distanceKm === "number" && cat.distanceKm <= 50);
        setMessage(items.length ? (exactNearby ? "Nearest PawPals are sorted by distance" : "No close cats yet, showing nearest PawPals") : "No cat profiles uploaded yet");
      })
      .catch(() => undefined);
  }, []);

  const filteredCats = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return cats;

    return cats.filter((cat) =>
      [cat.name, cat.breed, cat.gender, cat.age, cat.distance].some((value) => value?.toLowerCase().includes(normalized))
    );
  }, [cats, searchQuery]);

  useEffect(() => {
    setIndex(0);
  }, [searchQuery]);

  const cat = useMemo(() => (filteredCats.length ? filteredCats[index % filteredCats.length] : null), [filteredCats, index]);
  const normalizedAccountSearch = searchQuery.trim();

  useEffect(() => {
    let ignore = false;

    if (!normalizedAccountSearch) {
      setUserResults([]);
      setIsSearchingUsers(false);
      return () => {
        ignore = true;
      };
    }

    setIsSearchingUsers(true);
    apiFetch<PublicUser[]>(`/api/users?q=${encodeURIComponent(normalizedAccountSearch)}&limit=10`)
      .then((items) => {
        if (!ignore) setUserResults(items);
      })
      .catch(() => {
        if (!ignore) setUserResults([]);
      })
      .finally(() => {
        if (!ignore) setIsSearchingUsers(false);
      });

    return () => {
      ignore = true;
    };
  }, [normalizedAccountSearch]);

  function openSearch() {
    setShowSearch((current) => !current);
    window.setTimeout(() => searchInputRef.current?.focus(), 0);
  }

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
              placeholder="Search username, name, breed..."
              className="min-w-0 flex-1 bg-transparent text-sm font-black text-paw-ink outline-none placeholder:text-paw-cocoa/45"
            />
            {searchQuery ? (
              <button type="button" onClick={() => setSearchQuery("")} className="text-paw-pink" aria-label="Clear PawPals search">
                <X size={18} />
              </button>
            ) : null}
          </label>
          {normalizedAccountSearch ? (
            <section className="rounded-[20px] bg-white/90 p-3 shadow-soft">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h2 className="text-xs font-black uppercase text-paw-cocoa/70">Accounts</h2>
                {isSearchingUsers ? <span className="text-[11px] font-black text-paw-pink">Searching...</span> : null}
              </div>
              {userResults.length ? (
                <div className="space-y-2">
                  {userResults.map((user) => (
                    <Link
                      key={user.id}
                      href={`/users/${user.id}`}
                      className="flex w-full items-center gap-3 rounded-2xl bg-paw-blush/35 p-3 text-left"
                    >
                      <img
                        src={user.avatarUrl || profileIcon.src}
                        alt={user.username}
                        className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-black text-paw-ink">{user.name}</span>
                        <span className="block truncate text-xs font-bold text-paw-cocoa/70">@{user.username}</span>
                      </span>
                      <span className="rounded-full bg-paw-pink px-3 py-1.5 text-[11px] font-black text-white">View</span>
                    </Link>
                  ))}
                </div>
              ) : !isSearchingUsers ? (
                <p className="rounded-2xl bg-paw-blush/45 px-4 py-4 text-center text-xs font-black text-paw-cocoa">
                  No registered accounts found.
                </p>
              ) : null}
            </section>
          ) : null}
        </div>
      ) : null}

      <div className="hide-scrollbar mb-5 flex gap-3 overflow-x-auto">
        {filters.map((item) => {
          const Icon = item.icon;
          const active = filter === item.label;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setFilter(item.label);
                setMessage(item.label === "Nearby" ? "Nearest PawPals are sorted by distance" : `${item.label} filter selected`);
              }}
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
      </div>

      <div>
        {cat ? (
          <div
            role="button"
            tabIndex={0}
            onClick={() => window.location.assign(`/cats/${cat.id}`)}
            onKeyDown={(event) => {
              if (event.key === "Enter") window.location.assign(`/cats/${cat.id}`);
            }}
            className="relative h-[395px] overflow-hidden rounded-[27px] bg-paw-blush shadow-[0_20px_34px_rgba(122,81,63,0.18)]"
          >
            <img src={cat.image} alt={cat.name} className="h-full w-full object-cover" />
            <div className="absolute left-4 top-4 rounded-full bg-paw-pink px-4 py-2 text-xs font-black text-white shadow-soft">
              NEW
            </div>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                void swipe("LIKE");
              }}
              className="absolute right-4 top-4 grid h-12 w-12 place-items-center rounded-full bg-white/95 text-paw-cocoa shadow-soft"
              aria-label="Like cat"
            >
              <Heart size={24} />
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
              {searchQuery && userResults.length ? "Accounts found above" : searchQuery ? "No matches found" : "No cats yet"}
            </h2>
            <p className="mt-2 text-sm font-bold text-paw-cocoa/70">
              {searchQuery && userResults.length
                ? "Tap an account to view their profile."
                : searchQuery
                  ? "Try another username, name, breed, or location."
                  : "Uploaded cat profiles will appear here."}
            </p>
          </div>
        )}

        <div className="mt-7 grid grid-cols-3 items-center gap-5 px-12">
          <button
            className="grid h-[62px] w-[62px] place-items-center rounded-full bg-paw-lavender text-white shadow-[0_10px_24px_rgba(171,116,224,0.35)]"
            type="button"
            onClick={() => swipe("SKIP")}
            aria-label="Skip cat"
          >
            <X size={29} strokeWidth={3} />
          </button>
          <button
            className="mx-auto grid h-[86px] w-[86px] place-items-center rounded-full bg-white text-paw-rose shadow-[0_16px_28px_rgba(247,101,137,0.20)]"
            type="button"
            onClick={() => swipe("LIKE")}
            aria-label="Send paw"
          >
            <PawPrint className="fill-paw-pink/25" size={46} />
          </button>
          <button
            className="ml-auto grid h-[62px] w-[62px] place-items-center rounded-full bg-paw-pink text-white shadow-[0_10px_24px_rgba(247,101,137,0.35)]"
            type="button"
            onClick={() => swipe("LIKE")}
            aria-label="Like cat"
          >
            <Heart className="fill-white" size={28} />
          </button>
        </div>

        <div className="mt-6 flex items-center gap-3 rounded-[20px] bg-white/85 px-4 py-3 shadow-soft">
          <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-paw-blush">
            <img src={discoverCat1.src} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-paw-ink">{message}</p>
            <p className="text-xs font-bold text-paw-cocoa/65">Explore more profiles nearby</p>
          </div>
          <Sparkles size={28} className="shrink-0 text-paw-lavender" />
        </div>
      </div>
      <BottomNav />
    </section>
  );
}
