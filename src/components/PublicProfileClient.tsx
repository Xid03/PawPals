"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Heart, Lock, MapPin, MessageCircle, PawPrint, UserPlus } from "lucide-react";
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

export function PublicProfileClient({ id }: { id: string }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [cats, setCats] = useState<ApiCat[]>([]);
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [stats, setStats] = useState<ProfileStats>({ posts: 0, followers: 0, following: 0 });
  const [status, setStatus] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followRequestStatus, setFollowRequestStatus] = useState<string | null>(null);
  const [canViewPrivate, setCanViewPrivate] = useState(true);

  useEffect(() => {
    apiFetch<{ user: PublicUser; cats: ApiCat[]; stats: ProfileStats; isFollowing: boolean; followRequestStatus: string | null; canViewPrivate: boolean }>(`/api/users/${id}`)
      .then((data) => {
        setUser(data.user);
        setCats(data.cats);
        setStats(data.stats);
        setIsFollowing(data.isFollowing);
        setFollowRequestStatus(data.followRequestStatus);
        setCanViewPrivate(data.canViewPrivate);
        if (!data.canViewPrivate) {
          setPosts([]);
          return;
        }
        apiFetch<ApiPost[]>(`/api/posts?authorId=${id}&limit=10`)
          .then(setPosts)
          .catch(() => undefined);
      })
      .catch((error) => setStatus(error instanceof Error ? error.message : "Could not load profile"));
  }, [id]);

  useEffect(() => {
    if (followRequestStatus !== "PENDING") return;

    const timer = window.setInterval(() => {
      apiFetch<{ isFollowing: boolean; followRequestStatus: string | null; canViewPrivate: boolean }>(`/api/users/${id}`)
        .then((data) => {
          setIsFollowing(data.isFollowing);
          setFollowRequestStatus(data.followRequestStatus);
          setCanViewPrivate(data.canViewPrivate);
          if (data.isFollowing) {
            setStatus("Follow request approved.");
          }
        })
        .catch(() => undefined);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [followRequestStatus, id]);

  async function toggleFollow() {
    try {
      requireSignedIn();
      const nextMethod = isFollowing || followRequestStatus === "PENDING" ? "DELETE" : "POST";
      const data = await apiFetch<{ following: boolean; requested?: boolean }>(`/api/users/${id}/follow`, { method: nextMethod });
      const wasFollowing = isFollowing;
      setIsFollowing(data.following);
      setFollowRequestStatus(data.requested ? "PENDING" : null);
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
      await apiFetch("/api/conversations", {
        method: "POST",
        body: JSON.stringify({ userId: id })
      });
      window.location.href = "/chats";
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not start chat");
    }
  }

  const avatar = user?.avatarUrl || profileIcon.src;
  const hasPendingFollowRequest = followRequestStatus === "PENDING";
  const followButtonLabel = isFollowing ? "Following" : hasPendingFollowRequest ? "Requested" : user?.isPrivate ? "Request" : "Follow";

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
          <Link href="/discover" className="grid h-11 w-11 place-items-center rounded-full bg-white/85 text-paw-cocoa shadow-soft" aria-label="Go back">
            <ArrowLeft size={22} />
          </Link>
          <h1 className="text-lg font-black text-paw-ink">Profile</h1>
          <span className="h-11 w-11" />
        </header>

        <section className="rounded-[30px] bg-white/86 p-5 text-center shadow-soft">
          <img
            src={avatar}
            alt={user?.username ?? "Profile"}
            className="mx-auto h-24 w-24 rounded-full border-[5px] border-white object-cover shadow-soft"
          />
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
            <div className="border-r border-paw-cocoa/10">
              <p className="text-lg font-black text-paw-ink">{stats.posts}</p>
              <p className="text-xs font-bold text-paw-cocoa/70">Posts</p>
            </div>
            <div className="border-r border-paw-cocoa/10">
              <p className="text-lg font-black text-paw-ink">{stats.followers}</p>
              <p className="text-xs font-bold text-paw-cocoa/70">Followers</p>
            </div>
            <div>
              <p className="text-lg font-black text-paw-ink">{stats.following}</p>
              <p className="text-xs font-bold text-paw-cocoa/70">Following</p>
            </div>
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

        {canViewPrivate ? <section className="mt-4 rounded-[26px] bg-white/84 p-4 shadow-soft">
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
      <BottomNav />
    </section>
  );
}
