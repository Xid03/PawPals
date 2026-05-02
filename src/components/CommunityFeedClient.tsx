"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Flame, Heart, MoreHorizontal, PawPrint, Plus, Search, Users } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import type { DisplayPost } from "@/components/PostCard";
import { apiFetch, isGuestMode, requireSignedIn, type ApiPost } from "@/lib/api-client";
import bgArtwork from "../../images/bg.png";
import profileIcon from "../../images/profileIcon.png";

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

export function CommunityFeedClient() {
  const router = useRouter();
  const [mode, setMode] = useState("for-you");
  const [posts, setPosts] = useState<DisplayPost[]>([]);
  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [status, setStatus] = useState("");
  const [guest, setGuest] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setGuest(isGuestMode());
    apiFetch<ApiPost[]>(`/api/feed?mode=${mode}&limit=20`)
      .then((items) => {
        setPosts(items.map(mapPost));
      })
      .catch((error) => setStatus(error instanceof Error ? error.message : "Could not load posts"));
  }, [mode]);

  async function toggle(path: string, success: string) {
    try {
      await apiFetch(path, { method: "POST" });
      setStatus(success);
      const items = await apiFetch<ApiPost[]>(`/api/feed?mode=${mode}&limit=20`);
      setPosts(items.map(mapPost));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Action failed");
    }
  }

  const visiblePosts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return posts;
    return posts.filter((post) =>
      [post.user, post.text].some((value) => value.toLowerCase().includes(normalized))
    );
  }, [posts, query]);

  function openSearch() {
    setShowSearch(true);
    setTimeout(() => searchRef.current?.focus(), 0);
  }

  function openCreatePost() {
    try {
      requireSignedIn();
      router.push("/create");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Please log in to create posts.");
    }
  }

  function selectMode(value: string) {
    if (value === "following" && guest) {
      try {
        requireSignedIn();
      } catch {
        setStatus("");
      }
      return;
    }
    setMode(value);
  }

  function modeIcon(value: string) {
    if (value === "following") return <Users size={17} className="text-[#f2a700]" />;
    if (value === "trending") return <Flame size={17} className="fill-paw-pink/30 text-paw-pink" />;
    return <Heart size={17} className="fill-paw-lavender text-paw-lavender" />;
  }

  return (
    <section
      className="relative min-h-screen px-4 pb-24 pt-5"
      style={{
        backgroundImage: `linear-gradient(rgba(255,247,238,0.9), rgba(255,245,238,0.92)), url(${bgArtwork.src})`,
        backgroundPosition: "center top",
        backgroundSize: "cover",
        backgroundAttachment: "fixed"
      }}
    >
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-[28px] font-black text-paw-ink">
          Community <PawPrint size={28} className="inline -translate-y-1 fill-paw-pink/25 text-paw-pink" />
        </h1>
        <button
          className="grid h-12 w-12 place-items-center rounded-full bg-white/88 text-paw-ink shadow-soft"
          type="button"
          onClick={openSearch}
          aria-label="Search posts"
        >
          <Search size={23} strokeWidth={2.4} />
        </button>
      </header>
      <button
        className="hidden"
        type="button"
        onClick={openSearch}
        aria-label="Search posts"
      >
        <Search size={19} />
      </button>
      {showSearch ? (
        <div className="mb-4 px-5">
          <label className="paw-input flex h-12 items-center gap-3 rounded-2xl px-4">
            <Search size={17} className="text-paw-cocoa" />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search posts..."
              className="w-full bg-transparent text-sm font-bold outline-none"
            />
          </label>
        </div>
      ) : null}
      <div className="mb-4 flex gap-3 overflow-x-auto pb-1">
        {[
          ["for-you", "For You"],
          ["following", "Following"],
          ["trending", "Trending"]
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => selectMode(value)}
            className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-[20px] px-4 text-sm font-black shadow-soft ${
              mode === value
                ? "border-2 border-paw-lavender bg-paw-blush text-paw-lavender"
                : "bg-white/82 text-paw-ink"
            }`}
          >
            {modeIcon(value)}
            {label}
          </button>
        ))}
      </div>
      {status ? <p className="mb-3 px-5 text-xs font-extrabold text-paw-cocoa/70">{status}</p> : null}
      <div className="space-y-4">
        {visiblePosts.length ? visiblePosts.map((post) => (
          <article
            key={post.id}
            className="relative rounded-[24px] bg-white/86 p-4 shadow-soft"
          >
            <div className="flex items-start gap-3">
              <span className="relative shrink-0">
                <img src={post.avatar} alt={post.user} className="h-14 w-14 rounded-full object-cover ring-[3px] ring-white shadow-soft" />
                <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-[#35cf76] ring-2 ring-white" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-black leading-tight text-paw-ink">{post.user}</h2>
                    <p className="mt-1 text-sm font-bold text-paw-cocoa/70">{post.time}</p>
                  </div>
                  <button type="button" className="grid h-7 w-7 place-items-center rounded-full text-paw-ink" aria-label="Post options">
                    <MoreHorizontal size={20} />
                  </button>
                </div>
                <p className="mt-4 whitespace-pre-line text-base font-medium leading-relaxed text-paw-ink">{post.text}</p>
                {post.image ? <img src={post.image} alt="" className="mt-3 h-44 w-full rounded-2xl object-cover" /> : null}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-6 text-base font-bold">
                    <button type="button" onClick={() => toggle(`/api/posts/${post.id}/like`, "Like updated")} className="inline-flex items-center gap-2 text-paw-ink">
                      <Heart size={22} className={post.likes > 0 ? "fill-paw-pink text-paw-pink" : "text-paw-pink"} />
                      {post.likes}
                    </button>
                    <button type="button" className="inline-flex items-center gap-2 text-paw-ink" onClick={() => setStatus("Comments open from the post detail soon.")}>
                      <span className="text-paw-lavender">
                        <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6A8.38 8.38 0 0 1 12.5 3H13a8.48 8.48 0 0 1 8 8v.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      {post.comments}
                    </button>
                  </div>
                  <button type="button" onClick={() => toggle(`/api/posts/${post.id}/save`, "Saved posts updated")} className="text-paw-lavender" aria-label="Save post">
                    <Bookmark size={24} />
                  </button>
                </div>
              </div>
            </div>
          </article>
        )) : (
          <div className="rounded-[24px] bg-white/86 p-6 text-center shadow-soft">
            <PawPrint className="mx-auto h-12 w-12 fill-paw-pink/20 text-paw-pink" />
            <h2 className="mt-3 text-lg font-black text-paw-ink">No posts yet</h2>
            <p className="mt-2 text-sm font-bold text-paw-cocoa/70">Uploaded posts will appear here.</p>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={openCreatePost}
        className="fixed bottom-24 left-1/2 z-40 ml-[134px] grid h-16 w-16 -translate-x-1/2 place-items-center rounded-full bg-paw-pink text-white shadow-[0_14px_30px_rgba(247,101,137,0.35)] md:bottom-30"
        aria-label="Create post"
      >
        <Plus size={34} strokeWidth={2.4} />
      </button>
      <BottomNav />
    </section>
  );
}
