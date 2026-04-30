"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { PostCard, type DisplayPost } from "@/components/PostCard";
import { TagChip } from "@/components/TagChip";
import { apiFetch, type ApiPost } from "@/lib/api-client";
import { currentUser, posts as mockPosts } from "@/data/mockData";

function mapPost(post: ApiPost): DisplayPost {
  return {
    id: post.id,
    user: post.author?.username ?? "PawPal",
    avatar: post.author?.avatarUrl ?? currentUser.avatar,
    time: new Date(post.createdAt).toLocaleDateString(),
    text: post.text,
    image: post.images?.[0]?.url,
    likes: post._count?.likes ?? 0,
    comments: post._count?.comments ?? 0
  };
}

export function CommunityFeedClient() {
  const [mode, setMode] = useState("for-you");
  const [posts, setPosts] = useState<DisplayPost[]>(mockPosts);
  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [status, setStatus] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiFetch<ApiPost[]>(`/api/feed?mode=${mode}&limit=20`)
      .then((items) => {
        if (items.length) setPosts(items.map(mapPost));
      })
      .catch((error) => setStatus(error instanceof Error ? error.message : "Using mock posts"));
  }, [mode]);

  async function toggle(path: string, success: string) {
    try {
      await apiFetch(path, { method: "POST" });
      setStatus(success);
      const items = await apiFetch<ApiPost[]>(`/api/feed?mode=${mode}&limit=20`);
      if (items.length) setPosts(items.map(mapPost));
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

  return (
    <section className="relative min-h-screen bg-paw-radial pb-28">
      <PageHeader title="Community" />
      <button
        className="absolute right-5 top-7 grid h-10 w-10 place-items-center rounded-full bg-white/60"
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
      <div className="mb-4 flex gap-2 px-5">
        {[
          ["for-you", "For You"],
          ["following", "Following"],
          ["trending", "Trending"]
        ].map(([value, label]) => (
          <button key={value} type="button" onClick={() => setMode(value)}>
            <TagChip active={mode === value}>{label}</TagChip>
          </button>
        ))}
      </div>
      {status ? <p className="mb-3 px-5 text-xs font-extrabold text-paw-cocoa/70">{status}</p> : null}
      <div className="space-y-4 px-5">
        {visiblePosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onLike={() => toggle(`/api/posts/${post.id}/like`, "Like updated")}
            onSave={() => toggle(`/api/posts/${post.id}/save`, "Saved posts updated")}
          />
        ))}
      </div>
      <Link
        href="/create"
        className="fixed bottom-24 left-1/2 z-40 ml-[124px] grid h-16 w-16 -translate-x-1/2 place-items-center rounded-full bg-paw-pink text-white shadow-soft md:bottom-30"
        aria-label="Create post"
      >
        <Plus size={30} />
      </Link>
      <BottomNav />
    </section>
  );
}
