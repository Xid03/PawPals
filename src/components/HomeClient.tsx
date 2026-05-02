"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ChevronRight, MapPin, PawPrint, Search } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { PostCard, type DisplayPost } from "@/components/PostCard";
import { apiFetch, ageLabel, catImage, distanceLabel, isGuestMode, type ApiCat, type ApiPost } from "@/lib/api-client";
import { currentUser, cats as mockCats, posts as mockPosts, quickActions } from "@/data/mockData";
import backgroundButton from "../../images/backgroundButton.png";
import bgArtwork from "../../images/bg.png";
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
  const [userAvatar, setUserAvatar] = useState(profileIcon.src);
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
      setUserAvatar(profileIcon.src);
    }

    apiFetch<{ user: { name: string; avatarUrl?: string | null } }>("/api/auth/me")
      .then(({ user }) => {
        if (!isGuest) {
          setUserName(user.name || "Cat Lover");
          setUserAvatar(user.avatarUrl || profileIcon.src);
        }
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

  const avatarStack = useMemo(() => cats.slice(0, 2), [cats]);
  const actionDetails = {
    "Health Tips": { description: "Helpful tips for happy cats", tint: "bg-[#FFE9A8]", arrow: "text-[#F7B548]" },
    "Stories & Memes": { description: "Fun stories and cute memes", tint: "bg-[#FFDDE8]", arrow: "text-paw-pink" },
    "Vet Directory": { description: "Find trusted vets near you", tint: "bg-[#E7DCFF]", arrow: "text-paw-lavender" },
    Events: { description: "Upcoming cat events near you", tint: "bg-[#FFE2C6]", arrow: "text-[#FF9A56]" }
  };

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
    <section
      className="min-h-screen px-5 pb-28 pt-6"
      style={{
        backgroundImage: `linear-gradient(rgba(255,247,238,0.88), rgba(255,247,238,0.9)), url(${bgArtwork.src})`,
        backgroundPosition: "center top",
        backgroundSize: "cover",
        backgroundAttachment: "fixed"
      }}
    >
      <header className="mb-6 flex items-start justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {guest ? (
            <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-white ring-2 ring-paw-peach">
              <img src={profileIcon.src} alt="Guest" className="h-full w-full object-cover" />
            </span>
          ) : (
            <img
              src={userAvatar}
              alt={userName}
              className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-paw-peach"
            />
          )}
          <div className="min-w-0">
          <h1 className="max-w-[270px] text-[25px] font-black leading-[1.25] text-paw-ink">
            {guest ? (
              <>
                Welcome, <span className="text-paw-pink">Guest!</span>
              </>
            ) : (
              <>
                Good <span className="text-paw-pink">Meowning,</span>
                <br />
                {userName}! <PawPrint size={22} className="inline -translate-y-0.5 fill-paw-pink/20 text-paw-pink" />
              </>
            )}
          </h1>
          {guest ? <p className="mt-1 text-xs font-extrabold text-paw-cocoa/70">Browse PawPals with limited access</p> : null}
          </div>
        </div>
        <Link
          href="/profile"
          className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/85 text-paw-cocoa shadow-soft"
          aria-label="Open notifications"
        >
          <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full bg-paw-pink" />
          <Bell size={21} />
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

      <section
        className="relative mb-4 min-h-[220px] overflow-hidden rounded-[26px] px-5 py-5 text-center text-white shadow-soft"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(255,177,166,0.42), rgba(255,103,145,0.58), rgba(255,174,151,0.42)), url(${backgroundButton.src})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
          backgroundBlendMode: "soft-light, normal"
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[#ff8caf]/20" />
        <div className="relative z-10">
          <h2 className="text-lg font-black drop-shadow-sm">Meet Nearby PawPals ✦</h2>
          <div className="relative mx-auto my-4 flex w-fit items-center justify-center">
            {avatarStack.map((cat) => (
              <img
                key={cat.id}
                src={cat.image}
                alt={cat.name}
                className="-mx-1 h-[66px] w-[66px] rounded-full object-cover ring-[4px] ring-white"
              />
            ))}
            <span className="absolute bottom-0 left-1/2 grid h-9 w-9 -translate-x-1/2 translate-y-3 place-items-center rounded-full bg-white text-paw-pink shadow-soft">
              <PawPrint size={17} className="fill-paw-pink/20" />
            </span>
          </div>
          <p className="mb-2 mt-5 text-sm font-black drop-shadow-sm">{cats.length} cats ready to meet</p>
          <p className="mb-4 flex items-center justify-center gap-1 text-[12px] font-bold text-white/90 drop-shadow-sm">
            <MapPin size={13} className="fill-white/20" />
            {nearbyStatus}
          </p>
          <button
            type="button"
            onClick={exploreNearby}
            disabled={isLocating}
            className="mx-auto inline-flex min-w-[128px] items-center justify-center gap-2 rounded-full bg-[#f75f93] px-7 py-3 text-sm font-black text-white shadow-[0_10px_24px_rgba(247,95,147,0.34)] disabled:opacity-75"
          >
            {isLocating ? "Locating..." : "Explore"} <PawPrint size={17} />
          </button>
        </div>
      </section>

      <section className="mb-6 grid grid-cols-2 gap-3">
        {quickActions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className={`relative flex min-h-[104px] items-center gap-2 rounded-[20px] p-3 pr-9 shadow-soft ${actionDetails[action.title as keyof typeof actionDetails].tint}`}
          >
            <span className="grid h-[52px] w-[52px] shrink-0 place-items-center overflow-hidden rounded-[17px] bg-white/60">
              <img src={action.icon} alt="" className="h-[38px] w-[38px] object-contain" />
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-[12px] font-black leading-tight text-paw-ink">{action.title}</span>
              <span className="mt-1 block text-[10.5px] font-bold leading-snug text-paw-cocoa/75">
                {actionDetails[action.title as keyof typeof actionDetails].description}
              </span>
            </span>
            <span className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-white/80">
              <ChevronRight size={15} strokeWidth={3} className={actionDetails[action.title as keyof typeof actionDetails].arrow} />
            </span>
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
