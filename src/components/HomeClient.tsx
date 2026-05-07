"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ChevronRight, MapPin, PawPrint, Search, X } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { useCurrentUser } from "@/components/CurrentUserProvider";
import { PostCard, type DisplayPost } from "@/components/PostCard";
import { StatusToast } from "@/components/StatusToast";
import { apiFetch, ageLabel, catImage, distanceLabel, isGuestMode, type ApiCat, type ApiPost, type PublicUser } from "@/lib/api-client";
import { cats as mockCats, quickActions } from "@/data/mockData";
import backgroundButton from "../../images/backgroundButton.png";
import bgArtwork from "../../images/bg.png";
import profileIcon from "../../images/profileIcon.png";

type NotificationItem = {
  id: string;
  title: string;
  body?: string | null;
  type: string;
  data?: Record<string, unknown> | null;
  requester?: PublicUser | null;
  readAt?: string | null;
  createdAt: string;
};

const FOLLOW_BACK_EVENT = "pawpals:follow-back";

function mapPost(post: ApiPost): DisplayPost {
  return {
    id: post.id,
    user: post.author?.username ?? "PawPal",
    avatar: post.author?.avatarUrl ?? profileIcon.src,
    time: new Date(post.createdAt).toLocaleDateString(),
    text: post.text,
    image: post.images?.[0]?.url,
    likes: post._count?.likes ?? 0,
    comments: post._count?.comments ?? 0
  };
}

export function HomeClient({
  initialPosts = [],
  initialUser = null
}: {
  initialPosts?: ApiPost[];
  initialUser?: PublicUser | null;
}) {
  const router = useRouter();
  const { currentUser, setCurrentUser } = useCurrentUser();
  const seededUser = initialUser ?? currentUser;
  const [cats, setCats] = useState(mockCats);
  const [posts, setPosts] = useState<DisplayPost[]>(() => initialPosts.map(mapPost));
  const [userName, setUserName] = useState(seededUser?.name || "Cat Lover");
  const [userAvatar, setUserAvatar] = useState(seededUser?.avatarUrl || profileIcon.src);
  const [guest, setGuest] = useState(false);
  const [nearbyStatus, setNearbyStatus] = useState("Tap Explore to use your location");
  const [isLocating, setIsLocating] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsStatus, setNotificationsStatus] = useState("");
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [acceptingFollowRequestIds, setAcceptingFollowRequestIds] = useState<Set<string>>(() => new Set());
  const [followBackStatusByUserId, setFollowBackStatusByUserId] = useState<Record<string, "loading" | "following" | "requested">>({});
  const [homeSearch, setHomeSearch] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<PublicUser[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

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

    apiFetch<{ user: PublicUser }>("/api/auth/me")
      .then(({ user }) => {
        if (!isGuest) {
          setCurrentUser(user);
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

    apiFetch<ApiPost[]>("/api/posts?limit=1")
      .then((items) => {
        setPosts(items.map(mapPost));
      })
      .catch(() => undefined);
  }, [setCurrentUser]);

  const avatarStack = useMemo(() => cats.slice(0, 2), [cats]);
  const actionDetails = {
    "Health Tips": { description: "Helpful tips for happy cats", tint: "bg-[#FFE9A8]", arrow: "text-[#F7B548]" },
    "Stories & Memes": { description: "Fun stories and cute memes", tint: "bg-[#FFDDE8]", arrow: "text-paw-pink" },
    "Vet Directory": { description: "Find trusted vets near you", tint: "bg-[#E7DCFF]", arrow: "text-paw-lavender" },
    Events: { description: "Upcoming cat events near you", tint: "bg-[#FFE2C6]", arrow: "text-[#FF9A56]" }
  };
  const normalizedHomeSearch = homeSearch.trim().toLowerCase();
  const homeSearchResults = useMemo(() => {
    if (!normalizedHomeSearch) {
      return { actions: [], cats: [], posts: [] };
    }

    const matches = (...values: Array<string | undefined>) =>
      values.some((value) => value?.toLowerCase().includes(normalizedHomeSearch));

    return {
      actions: quickActions.filter((action) => {
        const detail = actionDetails[action.title as keyof typeof actionDetails];
        return matches(action.title, detail?.description);
      }),
      cats: cats.filter((cat) => matches(cat.name, cat.breed, cat.age, cat.distance, cat.about)),
      posts: posts.filter((post) => matches(post.user, post.text))
    };
  }, [cats, normalizedHomeSearch, posts]);
  const hasHomeSearchResults =
    userSearchResults.length || homeSearchResults.actions.length || homeSearchResults.cats.length || homeSearchResults.posts.length;

  useEffect(() => {
    let ignore = false;

    if (!normalizedHomeSearch) {
      setUserSearchResults([]);
      setIsSearchingUsers(false);
      return () => {
        ignore = true;
      };
    }

    setIsSearchingUsers(true);
    apiFetch<PublicUser[]>(`/api/users?q=${encodeURIComponent(normalizedHomeSearch)}&limit=8`)
      .then((items) => {
        if (!ignore) setUserSearchResults(items);
      })
      .catch(() => {
        if (!ignore) setUserSearchResults([]);
      })
      .finally(() => {
        if (!ignore) setIsSearchingUsers(false);
      });

    return () => {
      ignore = true;
    };
  }, [normalizedHomeSearch]);

  useEffect(() => {
    function handleFollowBack(event: Event) {
      const detail = (event as CustomEvent<{ userId?: string; status?: "following" | "requested" }>).detail;
      if (!detail?.userId || !detail.status) return;

      setFollowBackStatusByUserId((current) => ({ ...current, [detail.userId as string]: detail.status as "following" | "requested" }));
      setNotifications((current) =>
        current.map((notification) => {
          const followerId = typeof notification.data?.followerId === "string" ? notification.data.followerId : "";
          return followerId === detail.userId
            ? {
                ...notification,
                data: {
                  ...(notification.data ?? {}),
                  followBackStatus: detail.status
                }
              }
            : notification;
        })
      );
    }

    window.addEventListener(FOLLOW_BACK_EVENT, handleFollowBack);
    return () => window.removeEventListener(FOLLOW_BACK_EVENT, handleFollowBack);
  }, []);

  function submitHomeSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!normalizedHomeSearch) return;

    const firstAction = homeSearchResults.actions[0];
    if (firstAction && !homeSearchResults.cats.length && !homeSearchResults.posts.length) {
      router.push(firstAction.href);
    }
  }

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

  async function openNotifications() {
    setShowNotifications(true);
    setNotificationsStatus("");

    if (guest) {
      setNotifications([]);
      setNotificationsStatus("Please log in to view notifications.");
      return;
    }

    setIsLoadingNotifications(true);
    try {
      const items = await apiFetch<NotificationItem[]>("/api/notifications?limit=20");
      setNotifications(items);
      setNotificationsStatus(items.length ? "" : "No notifications yet.");
    } catch (error) {
      setNotificationsStatus(error instanceof Error ? error.message : "Could not load notifications.");
    } finally {
      setIsLoadingNotifications(false);
    }
  }

  async function markNotificationRead(id: string) {
    setNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, readAt: item.readAt ?? new Date().toISOString() } : item))
    );
    await apiFetch(`/api/notifications/${id}/read`, { method: "POST" }).catch(() => undefined);
  }

  function notificationHref(item: NotificationItem) {
    const postId = typeof item.data?.postId === "string" ? item.data.postId : "";
    const matchId = typeof item.data?.matchId === "string" ? item.data.matchId : "";
    const requesterId = typeof item.data?.requesterId === "string" ? item.data.requesterId : item.requester?.id ?? "";
    const followerId = typeof item.data?.followerId === "string" ? item.data.followerId : "";

    switch (item.type) {
      case "POST_LIKE":
      case "POST_COMMENT":
        return postId ? `/community?postId=${encodeURIComponent(postId)}` : "/community";
      case "NEW_MESSAGE":
        return "/chats";
      case "NEW_MATCH":
        return matchId ? `/chats?matchId=${encodeURIComponent(matchId)}` : "/chats";
      case "EVENT_REMINDER":
        return "/events";
      case "FOLLOW_REQUEST":
        return requesterId ? `/users/${encodeURIComponent(requesterId)}` : "/profile";
      case "NEW_FOLLOWER":
        return followerId ? `/users/${encodeURIComponent(followerId)}` : "/profile";
      default:
        return "/home";
    }
  }

  async function acceptFollowRequest(item: NotificationItem) {
    const followRequestId = typeof item.data?.followRequestId === "string" ? item.data.followRequestId : "";
    if (!followRequestId) {
      setNotificationsStatus("Follow request is no longer available.");
      return;
    }

    try {
      setAcceptingFollowRequestIds((current) => new Set(current).add(followRequestId));
      await apiFetch(`/api/follow-requests/${followRequestId}/approve`, { method: "POST" });
      await markNotificationRead(item.id);
      setNotifications((current) => current.filter((notification) => notification.id !== item.id));
      setNotificationsStatus("Follow request accepted.");
    } catch (error) {
      setNotificationsStatus(error instanceof Error ? error.message : "Could not accept follow request.");
    } finally {
      setAcceptingFollowRequestIds((current) => {
        const next = new Set(current);
        next.delete(followRequestId);
        return next;
      });
    }
  }

  async function followBack(item: NotificationItem) {
    const followerId = typeof item.data?.followerId === "string" ? item.data.followerId : "";
    if (!followerId) {
      setNotificationsStatus("Follower account is no longer available.");
      return;
    }

    setFollowBackStatusByUserId((current) => ({ ...current, [followerId]: "loading" }));
    try {
      const data = await apiFetch<{ following: boolean; requested?: boolean }>(`/api/users/${followerId}/follow`, {
        method: "POST"
      });
      await markNotificationRead(item.id);
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === item.id
            ? {
                ...notification,
                data: {
                  ...(notification.data ?? {}),
                  followBackStatus: data.requested ? "requested" : "following"
                }
              }
            : notification
        )
      );
      setFollowBackStatusByUserId((current) => ({
        ...current,
        [followerId]: data.requested ? "requested" : "following"
      }));
      window.dispatchEvent(
        new CustomEvent(FOLLOW_BACK_EVENT, {
          detail: { userId: followerId, status: data.requested ? "requested" : "following" }
        })
      );
      setNotificationsStatus(data.requested ? "Follow request sent." : "You followed back.");
    } catch (error) {
      setFollowBackStatusByUserId((current) => {
        const next = { ...current };
        delete next[followerId];
        return next;
      });
      setNotificationsStatus(error instanceof Error ? error.message : "Could not follow back.");
    }
  }

  async function openNotification(item: NotificationItem) {
    await markNotificationRead(item.id);
    setShowNotifications(false);
    router.push(notificationHref(item));
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
        <button
          type="button"
          onClick={openNotifications}
          className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/85 text-paw-cocoa shadow-soft"
          aria-label="Open notifications"
        >
          <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full bg-paw-pink" />
          <Bell size={21} />
        </button>
      </header>

      <form onSubmit={submitHomeSearch} className="paw-input mb-3 flex h-14 items-center gap-3 rounded-2xl px-4">
        <Search size={18} className="text-paw-cocoa" />
        <input
          placeholder="Search PawPals, tips, vets..."
          value={homeSearch}
          onChange={(event) => setHomeSearch(event.target.value)}
          className="w-full bg-transparent text-sm font-bold outline-none"
        />
        <button type="submit" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-paw-rose text-white" aria-label="Search PawPals">
          <PawPrint size={17} />
        </button>
      </form>

      {normalizedHomeSearch ? (
        <section className="mb-5 rounded-[22px] bg-white/90 p-4 shadow-soft">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-black text-paw-ink">Search Results</h2>
            <button
              type="button"
              onClick={() => setHomeSearch("")}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-paw-blush text-paw-cocoa"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          </div>
          {hasHomeSearchResults ? (
            <div className="space-y-3">
              {userSearchResults.map((user) => (
                <Link
                  key={user.id}
                  href={`/users/${user.id}`}
                  className="flex w-full items-center gap-3 rounded-2xl bg-paw-blush/50 p-3 text-left"
                >
                  <img
                    src={user.avatarUrl || profileIcon.src}
                    alt={user.username}
                    className="h-11 w-11 rounded-full object-cover ring-2 ring-white"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-black text-paw-ink">{user.name}</span>
                    <span className="block truncate text-xs font-bold text-paw-cocoa/70">@{user.username}</span>
                  </span>
                  <span className="rounded-full bg-paw-pink px-3 py-1.5 text-[11px] font-black text-white">View</span>
                </Link>
              ))}
              {homeSearchResults.actions.map((action) => (
                <Link key={action.title} href={action.href} className="flex items-center gap-3 rounded-2xl bg-paw-blush/50 p-3">
                  <img src={action.icon} alt="" className="h-9 w-9 rounded-xl object-contain" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-black text-paw-ink">{action.title}</span>
                    <span className="block truncate text-xs font-bold text-paw-cocoa/70">
                      {actionDetails[action.title as keyof typeof actionDetails].description}
                    </span>
                  </span>
                  <ChevronRight size={18} className="text-paw-pink" />
                </Link>
              ))}
              {homeSearchResults.cats.map((cat) => (
                <Link key={cat.id} href={`/cats/${cat.id}`} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-[0_7px_16px_rgba(122,81,63,0.05)]">
                  <img src={cat.image} alt={cat.name} className="h-11 w-11 rounded-full object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-black text-paw-ink">{cat.name}</span>
                    <span className="block truncate text-xs font-bold text-paw-cocoa/70">
                      {cat.breed} - {cat.distance}
                    </span>
                  </span>
                </Link>
              ))}
              {homeSearchResults.posts.map((post) => (
                <Link key={post.id} href="/community" className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-[0_7px_16px_rgba(122,81,63,0.05)]">
                  <img src={post.avatar} alt={post.user} className="h-11 w-11 rounded-full object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-black text-paw-ink">{post.user}</span>
                    <span className="block truncate text-xs font-bold text-paw-cocoa/70">{post.text}</span>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl bg-paw-blush/45 px-4 py-5 text-center text-sm font-black text-paw-cocoa">
              {isSearchingUsers ? "Searching accounts..." : "No results found."}
            </p>
          )}
        </section>
      ) : null}

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
      {posts[0] ? (
        <PostCard post={posts[0]} compact />
      ) : (
        <div className="rounded-[22px] bg-white/85 p-5 text-center text-sm font-black text-paw-cocoa shadow-soft">
          No posts yet.
        </div>
      )}
      {showNotifications ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-paw-ink/25 px-5 backdrop-blur-sm">
          <StatusToast message={notificationsStatus} onDismiss={() => setNotificationsStatus("")} />
          <div className="w-full max-w-[350px] rounded-[28px] border border-paw-peach/70 bg-[#fff8ef] p-5 shadow-paw">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black text-paw-ink">Notifications</h2>
                <p className="text-sm font-bold text-paw-cocoa/70">Latest PawPals updates</p>
              </div>
              <button
                type="button"
                onClick={() => setShowNotifications(false)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-paw-cocoa shadow-soft"
                aria-label="Close notifications"
              >
                <X size={20} />
              </button>
            </div>
            {isLoadingNotifications ? (
              <p className="rounded-2xl bg-white/75 px-4 py-5 text-center text-sm font-black text-paw-cocoa">
                Loading notifications...
              </p>
            ) : notifications.length ? (
              <div className="max-h-[330px] space-y-3 overflow-y-auto pr-1">
                {notifications.map((item) => (
                  (() => {
                    const followRequestId = typeof item.data?.followRequestId === "string" ? item.data.followRequestId : "";
                    const followerId = typeof item.data?.followerId === "string" ? item.data.followerId : "";
                    const isAccepting = followRequestId ? acceptingFollowRequestIds.has(followRequestId) : false;
                    const savedFollowBackStatus =
                      item.data?.followBackStatus === "following" || item.data?.followBackStatus === "requested"
                        ? item.data.followBackStatus
                        : undefined;
                    const followBackStatus = followerId ? followBackStatusByUserId[followerId] ?? savedFollowBackStatus : savedFollowBackStatus;
                    return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openNotification(item)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        void openNotification(item);
                      }
                    }}
                    className="flex w-full gap-3 rounded-2xl bg-white/80 p-3 text-left shadow-[0_8px_18px_rgba(122,81,63,0.06)]"
                    aria-label={`Open notification: ${item.title}`}
                  >
                    <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${item.readAt ? "bg-paw-cocoa/20" : "bg-paw-pink"}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-black text-paw-ink">{item.title}</span>
                      {item.body ? <span className="mt-1 block text-xs font-bold leading-relaxed text-paw-cocoa/70">{item.body}</span> : null}
                      {item.type === "FOLLOW_REQUEST" && followRequestId ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            void acceptFollowRequest(item);
                          }}
                          disabled={isAccepting}
                          className="mt-3 inline-flex h-9 items-center justify-center rounded-xl bg-paw-pink px-4 text-xs font-black text-white shadow-soft disabled:opacity-70"
                        >
                          {isAccepting ? "Accepting..." : "Accept"}
                        </button>
                      ) : null}
                      {item.type === "NEW_FOLLOWER" && followerId ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            void followBack(item);
                          }}
                          disabled={followBackStatus === "loading" || followBackStatus === "following" || followBackStatus === "requested"}
                          className="mt-3 inline-flex h-9 items-center justify-center rounded-xl bg-paw-pink px-4 text-xs font-black text-white shadow-soft disabled:opacity-70"
                        >
                          {followBackStatus === "loading"
                            ? "Following..."
                            : followBackStatus === "following"
                              ? "Following"
                              : followBackStatus === "requested"
                                ? "Requested"
                                : "Follow Back"}
                        </button>
                      ) : null}
                      <span className="mt-2 block text-[11px] font-black uppercase text-paw-pink/80">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </span>
                  </div>
                    );
                  })()
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-white/75 px-4 py-6 text-center">
                <Bell className="mx-auto h-10 w-10 text-paw-pink" />
                <p className="mt-3 text-sm font-black text-paw-cocoa">{notificationsStatus || "No notifications yet."}</p>
              </div>
            )}
          </div>
        </div>
      ) : null}
      <BottomNav />
    </section>
  );
}
