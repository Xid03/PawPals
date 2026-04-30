"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, MapPin, PawPrint, Search } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { PostCard, type DisplayPost } from "@/components/PostCard";
import { apiFetch, ageLabel, catImage, distanceLabel, isGuestMode, type ApiCat, type ApiPost } from "@/lib/api-client";
import { currentUser, cats as mockCats, posts as mockPosts, quickActions } from "@/data/mockData";
import profileIcon from "../../images/profileIcon.png";

function mapPost(post: ApiPost): DisplayPost {
  return {
    id: post.id,
    user: post.author?.username ?? "PawPal",
    avatar: post.author?.avatarUrl ?? currentUser.avatar,
    time: "Just now",
    text: post.text,
    image: post.images?.[0]?.url,
    likes: post._count?.likes ?? 0,
    comments: post._count?.comments ?? 0
  };
}

export function HomeClient() {
  const router = useRouter();
  const [cats, setCats] = useState(mockCats);
  const [posts, setPosts] = useState<DisplayPost[]>(mockPosts);
  const [userName, setUserName] = useState("Cat Lover");
  const [guest, setGuest] = useState(false);
  const [nearbyStatus, setNearbyStatus] = useState("Tap Explore to use your location");
  const [isLocating, setIsLocating] = useState(false);

  function mapCat(cat: ApiCat) {
    return {
      id: cat.id,
      name: cat.name,
      gender: cat.gender,
      breed: cat.breed,
      age: ageLabel(cat.ageMonths),
      distance: distanceLabel(cat),
      image: catImage(cat, mockCats[0].image),
      about: cat.description ?? "",
      personality: cat.personalityTags,
      lookingFor: cat.lookingFor
    };
  }

  useEffect(() => {
    const isGuest = isGuestMode();
    setGuest(isGuest);
    if (isGuest) {
      setUserName("Guest");
    }

    apiFetch<{ user: { name: string; avatarUrl?: string | null } }>("/api/auth/me")
      .then(({ user }) => {
        if (!isGuest) setUserName(user.name || "Cat Lover");
      })
      .catch(() => undefined);

    apiFetch<ApiCat[]>("/api/cats?limit=4")
      .then((items) => {
        if (items.length) {
          setCats(items.map(mapCat));
        }
      })
      .catch(() => undefined);

    const savedLocation = window.localStorage.getItem("pawpals_location");
    if (savedLocation) {
      try {
        const location = JSON.parse(savedLocation) as { lat: number; lng: number };
        void loadNearby(location.lat, location.lng, false);
      } catch {
        window.localStorage.removeItem("pawpals_location");
      }
    }

    apiFetch<ApiPost[]>("/api/feed?mode=for-you&limit=1")
      .then((items) => {
        if (items.length) setPosts(items.map(mapPost));
      })
      .catch(() => undefined);
  }, []);

  const avatarStack = useMemo(() => cats.slice(0, 4), [cats]);

  async function loadNearby(lat: number, lng: number, updateStatus = true) {
    const items = await apiFetch<ApiCat[]>(
      `/api/cats/nearby?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&radiusKm=50&limit=4`
    );
    if (items.length) {
      setCats(items.map(mapCat));
      if (updateStatus) {
        const exactNearby = items.some((cat) => typeof cat.distanceKm === "number" && cat.distanceKm <= 50);
        setNearbyStatus(exactNearby ? "Sorted by your current location" : "No close cats yet, showing nearest PawPals");
      }
    } else if (updateStatus) {
      setNearbyStatus("No nearby cats found yet");
    }
  }

  function exploreNearby() {
    if (!navigator.geolocation) {
      setNearbyStatus("Location is not available in this browser");
      router.push("/discover");
      return;
    }

    setIsLocating(true);
    setNearbyStatus("Finding nearby PawPals...");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        window.localStorage.setItem("pawpals_location", JSON.stringify({ lat, lng }));
        try {
          await loadNearby(lat, lng);
        } catch (error) {
          setNearbyStatus(error instanceof Error ? error.message : "Could not load nearby cats");
        } finally {
          setIsLocating(false);
          router.push(`/discover?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`);
        }
      },
      () => {
        setIsLocating(false);
        setNearbyStatus("Location permission was not enabled");
        router.push("/discover");
      },
      { enableHighAccuracy: true, maximumAge: 5 * 60 * 1000, timeout: 10000 }
    );
  }

  return (
    <section className="min-h-screen bg-paw-radial px-5 pb-28 pt-6">
      <header className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-3">
          {guest ? (
            <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-white ring-2 ring-paw-peach">
              <img src={profileIcon.src} alt="Guest" className="h-full w-full object-cover" />
            </span>
          ) : (
            <img
              src={currentUser.avatar}
              alt={userName}
              className="h-12 w-12 rounded-full object-cover ring-2 ring-paw-peach"
            />
          )}
          <div>
            <h1 className="max-w-64 text-2xl font-black leading-tight text-paw-ink">
              {guest ? "Welcome, Guest!" : `Good Meowning, ${userName}!`}
            </h1>
            {guest ? <p className="mt-1 text-xs font-extrabold text-paw-cocoa/70">Browse PawPals with limited access</p> : null}
          </div>
        </div>
        <Link
          href="/profile"
          className="grid h-10 w-10 place-items-center rounded-full bg-white/60"
          aria-label="Open notifications"
        >
          <Bell size={19} />
        </Link>
      </header>

      <label className="paw-input mb-5 flex h-14 items-center gap-3 rounded-2xl px-4">
        <Search size={18} className="text-paw-cocoa" />
        <input
          placeholder="Search PawPals, tips, vets..."
          className="w-full bg-transparent text-sm font-bold outline-none"
        />
        <span className="grid h-8 w-8 place-items-center rounded-full bg-paw-rose text-white">
          <PawPrint size={17} />
        </span>
      </label>

      <section className="mb-4 rounded-3xl bg-gradient-to-br from-paw-peach to-paw-rose p-5 text-center text-white shadow-soft">
        <h2 className="text-base font-black">Meet Nearby PawPals</h2>
        <div className="my-4 flex justify-center -space-x-3">
          {avatarStack.map((cat) => (
            <img
              key={cat.id}
              src={cat.image}
              alt={cat.name}
              className="h-14 w-14 rounded-full object-cover ring-4 ring-white/70"
            />
          ))}
        </div>
        <p className="mb-1 text-xs font-bold">{cats.length} cats ready to meet</p>
        <p className="mb-3 text-[11px] font-bold text-white/80">{nearbyStatus}</p>
        <button
          type="button"
          onClick={exploreNearby}
          disabled={isLocating}
          className="mx-auto inline-flex items-center gap-2 rounded-full bg-paw-pink px-7 py-3 text-sm font-black shadow-soft"
        >
          {isLocating ? "Locating..." : "Explore"} <PawPrint size={17} />
        </button>
      </section>

      <section className="mb-6 grid grid-cols-2 gap-3">
        {quickActions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className={`flex min-h-20 items-center gap-3 rounded-2xl p-4 shadow-soft ${action.color}`}
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white/55">
              <img src={action.icon} alt="" className="h-full w-full object-cover object-center" />
            </span>
            <span className="text-sm font-black leading-tight text-paw-ink">{action.title}</span>
          </Link>
        ))}
      </section>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-black">Recent Posts</h2>
        <Link href="/community" className="text-xs font-extrabold text-paw-cocoa/70">
          See all
        </Link>
      </div>
      <PostCard post={posts[0]} compact />
      <div className="mt-3 flex items-center gap-1 text-xs font-bold text-paw-cocoa/70">
        <MapPin size={14} /> Live from the PawPals API
      </div>
      <BottomNav />
    </section>
  );
}
