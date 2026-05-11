"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Heart, Lock, MapPin, MessageCircle, PawPrint, UserPlus, Users, X } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { StatusToast } from "@/components/StatusToast";
import { apiFetch, requireSignedIn, type ApiCat, type ApiPost, type PublicUser } from "@/lib/api-client";
import profileBg from "../../images/profileBg.png";
import profileIcon from "../../images/profileIcon.png";

type ProfileStats = {
  posts: number;
  followers: number;
  following: number;
};

type IncomingFollowRequest = {
  id: string;
  status: string;
};

type ConnectionPanel = "followers" | "following" | null;

type ApiStory = {
  id: string;
  url: string;
  type: "IMAGE" | "VIDEO";
  caption?: string | null;
  createdAt: string;
  expiresAt: string;
  author?: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string | null;
  };
  _count?: {
    views: number;
  };
  viewedByMe?: boolean;
};

type ProfileStory = {
  id: string;
  image: string;
  type: "IMAGE" | "VIDEO";
  caption: string;
  createdAt: string;
  expiresAt: string;
  viewedByMe: boolean;
  views: number;
};

const FOLLOW_BACK_EVENT = "pawpals:follow-back";
const FOLLOW_REQUEST_ACCEPTED_EVENT = "pawpals:follow-request-accepted";

function isStoryActive(story: { expiresAt: string }) {
  return new Date(story.expiresAt).getTime() > Date.now();
}

function mapProfileStory(story: ApiStory): ProfileStory {
  return {
    id: story.id,
    image: story.url,
    type: story.type,
    caption: story.caption ?? "Shared a new story.",
    createdAt: story.createdAt,
    expiresAt: story.expiresAt,
    viewedByMe: Boolean(story.viewedByMe),
    views: story._count?.views ?? 0
  };
}

export function PublicProfileClient({ id }: { id: string }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [cats, setCats] = useState<ApiCat[]>([]);
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [followers, setFollowers] = useState<PublicUser[]>([]);
  const [following, setFollowing] = useState<PublicUser[]>([]);
  const [stats, setStats] = useState<ProfileStats>({ posts: 0, followers: 0, following: 0 });
  const [status, setStatus] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowedByViewedUser, setIsFollowedByViewedUser] = useState(false);
  const [followRequestStatus, setFollowRequestStatus] = useState<string | null>(null);
  const [incomingFollowRequest, setIncomingFollowRequest] = useState<IncomingFollowRequest | null>(null);
  const [canViewPrivate, setCanViewPrivate] = useState(true);
  const [activeConnectionPanel, setActiveConnectionPanel] = useState<ConnectionPanel>(null);
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const [hasLoadedProfile, setHasLoadedProfile] = useState(false);
  const [profileStories, setProfileStories] = useState<ProfileStory[]>([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);

  function applyRelationshipState(data: {
    isFollowing: boolean;
    isFollowedByViewedUser: boolean;
    followRequestStatus: string | null;
    incomingFollowRequest: IncomingFollowRequest | null;
    canViewPrivate: boolean;
    stats?: ProfileStats;
  }) {
    setIsFollowing(data.isFollowing);
    setIsFollowedByViewedUser(data.isFollowedByViewedUser);
    setFollowRequestStatus(data.followRequestStatus);
    setIncomingFollowRequest(data.incomingFollowRequest);
    setCanViewPrivate(data.canViewPrivate);
    if (data.stats) setStats(data.stats);
  }

  useEffect(() => {
    setHasLoadedProfile(false);
    apiFetch<{
      user: PublicUser;
      cats: ApiCat[];
      stats: ProfileStats;
      isFollowing: boolean;
      isFollowedByViewedUser: boolean;
      followRequestStatus: string | null;
      incomingFollowRequest: IncomingFollowRequest | null;
      canViewPrivate: boolean;
    }>(`/api/users/${id}`)
      .then((data) => {
        setUser(data.user);
        setCats(data.cats);
        setStats(data.stats);
        applyRelationshipState(data);
        setHasLoadedProfile(true);
        if (!data.canViewPrivate) {
          setPosts([]);
          setFollowers([]);
          setFollowing([]);
          setProfileStories([]);
          return;
        }
        Promise.all([
          apiFetch<ApiPost[]>(`/api/posts?authorId=${id}&limit=10`),
          apiFetch<PublicUser[]>(`/api/users/${id}/followers?limit=50`),
          apiFetch<PublicUser[]>(`/api/users/${id}/following?limit=50`)
        ])
          .then(([postsData, followersData, followingData]) => {
            setPosts(postsData);
            setFollowers(followersData);
            setFollowing(followingData);
          })
          .catch(() => undefined);
      })
      .catch((error) => {
        setHasLoadedProfile(true);
        setStatus(error instanceof Error ? error.message : "Could not load profile");
      });
  }, [id]);

  useEffect(() => {
    if (!hasLoadedProfile || !canViewPrivate) return;

    apiFetch<ApiStory[]>(`/api/stories?authorId=${id}&limit=30`)
      .then((stories) => {
        setProfileStories(
          stories
            .filter(isStoryActive)
            .map(mapProfileStory)
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        );
      })
      .catch(() => setProfileStories([]));
  }, [canViewPrivate, hasLoadedProfile, id]);

  useEffect(() => {
    if (followRequestStatus !== "PENDING") return;

    const timer = window.setInterval(() => {
          apiFetch<{ isFollowing: boolean; isFollowedByViewedUser: boolean; followRequestStatus: string | null; incomingFollowRequest: IncomingFollowRequest | null; canViewPrivate: boolean }>(`/api/users/${id}`)
        .then((data) => {
          applyRelationshipState(data);
          if (data.isFollowing) {
            setStatus("Follow request approved.");
          }
        })
        .catch(() => undefined);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [followRequestStatus, id]);

  useEffect(() => {
    function handleFollowRequestAccepted(event: Event) {
      const detail = (event as CustomEvent<{ requesterId?: string }>).detail;
      if (detail?.requesterId !== id) return;

      apiFetch<{
        stats: ProfileStats;
        isFollowing: boolean;
        isFollowedByViewedUser: boolean;
        followRequestStatus: string | null;
        incomingFollowRequest: IncomingFollowRequest | null;
        canViewPrivate: boolean;
      }>(`/api/users/${id}`)
        .then((data) => {
          applyRelationshipState(data);
          setStatus(data.isFollowing ? "Follow request accepted." : "Follow request accepted. You can follow back now.");
        })
        .catch(() => {
          setIncomingFollowRequest(null);
          setIsFollowedByViewedUser(true);
        });
    }

    window.addEventListener(FOLLOW_REQUEST_ACCEPTED_EVENT, handleFollowRequestAccepted);
    return () => window.removeEventListener(FOLLOW_REQUEST_ACCEPTED_EVENT, handleFollowRequestAccepted);
  }, [id]);

  async function toggleFollow() {
    try {
      requireSignedIn();
      if (incomingFollowRequest?.id) {
        await apiFetch(`/api/follow-requests/${incomingFollowRequest.id}/approve`, { method: "POST" });
        setIncomingFollowRequest(null);
        setIsFollowedByViewedUser(true);
        window.dispatchEvent(new CustomEvent(FOLLOW_REQUEST_ACCEPTED_EVENT, { detail: { requesterId: id } }));
        setStats((current) => ({ ...current, following: current.following + 1 }));
        setStatus("Follow request accepted.");
        return;
      }

      const nextMethod = isFollowing || followRequestStatus === "PENDING" ? "DELETE" : "POST";
      const data = await apiFetch<{ following: boolean; requested?: boolean }>(`/api/users/${id}/follow`, { method: nextMethod });
      const wasFollowing = isFollowing;
      const wasFollowBack = !wasFollowing && isFollowedByViewedUser;
      setIsFollowing(data.following);
      setFollowRequestStatus(data.requested ? "PENDING" : null);
      if (wasFollowBack && nextMethod === "POST") {
        window.dispatchEvent(
          new CustomEvent(FOLLOW_BACK_EVENT, {
            detail: { userId: id, status: data.requested ? "requested" : "following" }
          })
        );
      }
      setStats((current) => ({
        ...current,
        followers: Math.max(0, current.followers + (data.following ? 1 : wasFollowing ? -1 : 0))
      }));
      if (data.requested) {
        setStatus("Follow request sent.");
      } else if (followRequestStatus === "PENDING") {
        setStatus("Follow request removed.");
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not follow this account");
    }
  }

  async function startChat() {
    if (!canViewPrivate) {
      setStatus("This account is private and cannot receive messages.");
      return;
    }
    try {
      requireSignedIn();
      const data = await apiFetch<{ conversation: { id: string } }>("/api/conversations", {
        method: "POST",
        body: JSON.stringify({ userId: id })
      });
      window.location.href = `/chats?conversationId=${encodeURIComponent(data.conversation.id)}`;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not start chat");
    }
  }

  async function openConnectionPanel(panel: Exclude<ConnectionPanel, null>) {
    if (!canViewPrivate) {
      setStatus("This account is private.");
      return;
    }

    setActiveConnectionPanel(panel);
    const hasLoaded = panel === "followers" ? followers.length > 0 || stats.followers === 0 : following.length > 0 || stats.following === 0;
    if (hasLoaded) return;

    setIsLoadingConnections(true);
    try {
      const people = await apiFetch<PublicUser[]>(`/api/users/${id}/${panel}?limit=50`);
      if (panel === "followers") {
        setFollowers(people);
      } else {
        setFollowing(people);
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not load this list.");
    } finally {
      setIsLoadingConnections(false);
    }
  }

  function openProfileStories() {
    if (!profileStories.length) return;
    setActiveStoryIndex(0);
  }

  function moveProfileStory(direction: -1 | 1) {
    setActiveStoryIndex((current) => {
      if (current === null || !profileStories.length) return current;
      return (current + direction + profileStories.length) % profileStories.length;
    });
  }

  const avatar = user?.avatarUrl || profileIcon.src;
  const activeStory = activeStoryIndex === null ? null : profileStories[activeStoryIndex];
  const activeStoryProgressIndex = activeStoryIndex ?? 0;
  const hasUnviewedStories = useMemo(() => profileStories.some((story) => !story.viewedByMe), [profileStories]);
  const hasPendingFollowRequest = followRequestStatus === "PENDING";
  const hasIncomingFollowRequest = incomingFollowRequest?.status === "PENDING";
  const followButtonLabel = isFollowing
    ? "Following"
    : hasIncomingFollowRequest
      ? "Accept"
      : hasPendingFollowRequest
        ? "Requested"
        : isFollowedByViewedUser
          ? "Follow Back"
          : user?.isPrivate
            ? "Request"
            : "Follow";

  useEffect(() => {
    if (!activeStory || activeStory.viewedByMe) return;

    setProfileStories((current) =>
      current.map((story) => (story.id === activeStory.id ? { ...story, viewedByMe: true } : story))
    );
    void apiFetch<{ counted: boolean }>(`/api/stories/${activeStory.id}/view`, { method: "POST" }).catch(() => undefined);
  }, [activeStory]);

  return (
    <section
      className="relative min-h-screen bg-[#fff8ef] px-5 pb-28 pt-5"
      style={{
        backgroundImage: `url(${profileBg.src})`,
        backgroundPosition: "center top",
        backgroundSize: "cover",
        backgroundAttachment: "fixed"
      }}
    >
      <div className="mx-auto max-w-[430px]">
        <header className="mb-5 flex items-center justify-between">
          <Link href="/home" className="grid h-11 w-11 place-items-center rounded-full bg-white/85 text-paw-cocoa shadow-soft" aria-label="Go to Home">
            <ArrowLeft size={22} />
          </Link>
          <h1 className="text-lg font-black text-paw-ink">Profile</h1>
          <span className="h-11 w-11" />
        </header>

        <section className="rounded-[30px] bg-white/86 p-5 text-center shadow-soft">
          <button
            type="button"
            onClick={openProfileStories}
            disabled={!profileStories.length}
            className={`mx-auto grid h-[104px] w-[104px] place-items-center rounded-full shadow-soft transition active:scale-95 disabled:cursor-default disabled:active:scale-100 ${
              hasUnviewedStories ? "bg-gradient-to-br from-paw-pink to-paw-lavender p-[5px]" : "bg-white p-[5px]"
            }`}
            aria-label={profileStories.length ? `View ${user?.name ?? "user"} stories` : "No stories available"}
          >
            <img
              src={avatar}
              alt={user?.username ?? "Profile"}
              className="h-full w-full rounded-full border-[4px] border-white object-cover"
            />
          </button>
          <h2 className="mt-4 text-[26px] font-black leading-tight text-paw-ink">
            {user?.name ?? "Loading profile"} <PawPrint className="inline h-6 w-6 fill-paw-pink/30 text-paw-pink" />
          </h2>
          <p className="mt-1 text-sm font-black text-paw-cocoa/70">{user ? `@${user.username}` : "Please wait..."}</p>
          {user?.isPrivate ? (
            <p className="mx-auto mt-3 inline-flex items-center gap-2 rounded-full bg-paw-blush px-4 py-2 text-xs font-black text-paw-cocoa">
              <Lock size={14} className="text-paw-pink" />
              Private account
            </p>
          ) : null}
          {user?.city ? (
            <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-paw-blush px-4 py-2 text-xs font-black text-paw-cocoa">
              <MapPin size={14} className="text-paw-pink" />
              {user.city}
            </p>
          ) : null}
          {user?.bio ? <p className="mx-auto mt-4 max-w-[310px] text-sm font-bold leading-relaxed text-paw-cocoa">{user.bio}</p> : null}

          <div className="mt-5 grid grid-cols-3 rounded-[22px] bg-[#fff8ef] py-3">
            <button
              type="button"
              onClick={() => document.getElementById("profile-posts")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="border-r border-paw-cocoa/10"
            >
              <p className="text-lg font-black text-paw-ink">{stats.posts}</p>
              <p className="text-xs font-bold text-paw-cocoa/70">Posts</p>
            </button>
            <button type="button" onClick={() => void openConnectionPanel("followers")} className="border-r border-paw-cocoa/10">
              <p className="text-lg font-black text-paw-ink">{stats.followers}</p>
              <p className="text-xs font-bold text-paw-cocoa/70">Followers</p>
            </button>
            <button type="button" onClick={() => void openConnectionPanel("following")}>
              <p className="text-lg font-black text-paw-ink">{stats.following}</p>
              <p className="text-xs font-bold text-paw-cocoa/70">Following</p>
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={toggleFollow}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-paw-pink text-sm font-black text-white shadow-soft"
            >
              <UserPlus size={18} />
              {followButtonLabel}
            </button>
            <button
              type="button"
              onClick={startChat}
              disabled={!canViewPrivate}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white text-sm font-black text-paw-cocoa shadow-soft disabled:opacity-50"
            >
              <MessageCircle size={18} />
              Chat
            </button>
          </div>
        </section>

        <StatusToast message={status} onDismiss={() => setStatus("")} />

        {!canViewPrivate ? (
          <section className="mt-4 rounded-[26px] bg-white/84 p-6 text-center shadow-soft">
            <Lock className="mx-auto h-10 w-10 text-paw-pink" />
            <h3 className="mt-3 text-lg font-black text-paw-ink">Private Account</h3>
            <p className="mx-auto mt-2 max-w-[280px] text-sm font-bold leading-relaxed text-paw-cocoa/70">
              Posts, followers, following, and messages are hidden by this user.
            </p>
          </section>
        ) : null}

        {canViewPrivate ? <section id="profile-posts" className="mt-4 rounded-[26px] bg-white/84 p-4 shadow-soft">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-black text-paw-ink">
            <PawPrint className="h-5 w-5 fill-paw-pink/30 text-paw-pink" />
            Cats
          </h3>
          {cats.length ? (
            <div className="grid grid-cols-2 gap-3">
              {cats.map((cat) => (
                <Link key={cat.id} href={`/cats/${cat.id}`} className="overflow-hidden rounded-2xl bg-paw-blush/45 shadow-[0_8px_18px_rgba(122,81,63,0.06)]">
                  <img src={cat.photos?.[0]?.url || profileIcon.src} alt={cat.name} className="h-28 w-full object-cover" />
                  <div className="p-3">
                    <p className="truncate text-sm font-black text-paw-ink">{cat.name}</p>
                    <p className="truncate text-xs font-bold text-paw-cocoa/70">{cat.breed}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl bg-paw-blush/45 px-4 py-5 text-center text-sm font-black text-paw-cocoa">No cats uploaded yet.</p>
          )}
        </section> : null}

        {canViewPrivate ? <section className="mt-4 rounded-[26px] bg-white/84 p-4 shadow-soft">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-black text-paw-ink">
            <FileText className="h-5 w-5 text-paw-pink" />
            Posts
          </h3>
          {posts.length ? (
            <div className="space-y-3">
              {posts.map((post) => (
                <Link key={post.id} href="/community" className="block rounded-2xl bg-white p-3 shadow-[0_8px_18px_rgba(122,81,63,0.06)]">
                  <p className="line-clamp-2 text-sm font-bold leading-relaxed text-paw-ink">{post.text}</p>
                  <p className="mt-2 flex items-center gap-2 text-xs font-black text-paw-cocoa/70">
                    <Heart size={14} className="fill-paw-pink/20 text-paw-pink" />
                    {post._count?.likes ?? 0} likes
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl bg-paw-blush/45 px-4 py-5 text-center text-sm font-black text-paw-cocoa">No posts yet.</p>
          )}
        </section> : null}
      </div>
      {activeConnectionPanel ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-paw-ink/25 px-5 backdrop-blur-sm">
          <div className="w-full max-w-[350px] rounded-[28px] border border-paw-peach/70 bg-[#fff8ef] p-5 shadow-paw">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-lg font-black text-paw-ink">
                <Users className="h-5 w-5 text-paw-pink" />
                {activeConnectionPanel === "followers" ? "Followers" : "Following"}
              </h3>
              <button
                type="button"
                onClick={() => setActiveConnectionPanel(null)}
                className="grid h-9 w-9 place-items-center rounded-full bg-white text-paw-cocoa shadow-soft"
                aria-label="Close list"
              >
                <X size={18} />
              </button>
            </div>
            {isLoadingConnections ? (
              <p className="rounded-2xl bg-white/80 px-4 py-5 text-center text-sm font-black text-paw-cocoa">Loading...</p>
            ) : (activeConnectionPanel === "followers" ? followers : following).length ? (
              <div className="max-h-[330px] space-y-3 overflow-y-auto pr-1">
                {(activeConnectionPanel === "followers" ? followers : following).map((person) => (
                  <Link
                    key={person.id}
                    href={`/users/${person.id}`}
                    onClick={() => setActiveConnectionPanel(null)}
                    className="flex items-center gap-3 rounded-2xl bg-white/80 p-3 shadow-[0_8px_18px_rgba(122,81,63,0.06)]"
                  >
                    <img src={person.avatarUrl || profileIcon.src} alt={person.username} className="h-12 w-12 rounded-full object-cover" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-paw-ink">{person.name}</span>
                      <span className="block truncate text-xs font-bold text-paw-cocoa/70">@{person.username}</span>
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl bg-white/80 px-4 py-5 text-center text-sm font-black text-paw-cocoa">
                {activeConnectionPanel === "followers" ? "No followers yet." : "Not following anyone yet."}
              </p>
            )}
          </div>
        </div>
      ) : null}
      {activeStory ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-[#6d9ed0]/75 px-5 py-8 text-white backdrop-blur-sm">
          <div className="relative h-[84vh] max-h-[690px] w-full max-w-[360px] overflow-hidden rounded-[24px] bg-[#052a47] shadow-[0_20px_48px_rgba(10,35,60,0.42)]">
            <div className="absolute inset-0">
              {activeStory.type === "VIDEO" ? (
                <video src={activeStory.image} className="absolute inset-0 h-full w-full object-cover" autoPlay controls />
              ) : (
                <img src={activeStory.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-[#002c4f]/88 via-transparent to-black/78" />
            </div>
            <div className="absolute left-5 right-5 top-5 z-10 flex gap-1.5">
              {profileStories.map((story, index) => (
                <span key={story.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/55">
                  <span className={`block h-full rounded-full bg-paw-pink ${index <= activeStoryProgressIndex ? "w-full" : "w-0"}`} />
                </span>
              ))}
            </div>
            <div className="absolute left-5 right-5 top-10 z-10 flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-white to-paw-pink p-[3px] shadow-soft">
                  <img src={avatar} alt={user?.name ?? "Story"} className="h-full w-full rounded-full object-cover" />
                </span>
                <div className="min-w-0 pt-1 text-left">
                  <h2 className="flex min-w-0 items-center gap-1.5 text-xl font-black leading-none drop-shadow">
                    <span className="truncate">{user?.name ?? "PawPal"}</span>
                    <PawPrint className="h-6 w-6 shrink-0 fill-paw-pink text-paw-pink" />
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveStoryIndex(null)}
                className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/20 bg-white/18 text-white shadow-soft backdrop-blur-sm"
                aria-label="Close story"
              >
                <X size={28} strokeWidth={3} />
              </button>
            </div>
            <button
              type="button"
              onClick={() => moveProfileStory(-1)}
              className="absolute bottom-20 left-0 top-24 z-10 w-1/2"
              aria-label="Previous story"
            />
            <button
              type="button"
              onClick={() => moveProfileStory(1)}
              className="absolute bottom-20 right-0 top-24 z-10 w-1/2"
              aria-label="Next story"
            />
            <div className="absolute bottom-6 left-5 right-5 z-10">
              <p className="max-w-[280px] text-lg font-black leading-snug drop-shadow">
                <span className="mr-1.5 align-top text-4xl leading-none text-paw-pink">“</span>
                {activeStory.caption}
              </p>
            </div>
          </div>
        </div>
      ) : null}
      <BottomNav />
    </section>
  );
}
