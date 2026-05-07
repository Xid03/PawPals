"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, TouchEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, Camera, ChevronLeft, ChevronRight, Heart, ImageIcon, ImagePlus, MessageCircle, MoreHorizontal, PawPrint, Plus, Send, Sparkles, X } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { StatusToast } from "@/components/StatusToast";
import type { DisplayPost } from "@/components/PostCard";
import { apiFetch, requireSignedIn } from "@/lib/api-client";
import { posts as mockPosts, stories as mockStories } from "@/data/mockData";

type ApiStory = {
  id: string;
  url: string;
  type: "IMAGE" | "VIDEO";
  caption?: string | null;
  createdAt: string;
  author?: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string | null;
  };
  _count?: {
    likes: number;
    views: number;
  };
};

type StoryItem = {
  id: string;
  ownerKey: string;
  name: string;
  image: string;
  avatar: string;
  caption: string;
  likes: number;
  views: number;
  isApiStory: boolean;
};

function initialStories(): StoryItem[] {
  return mockStories.map((story, index) => ({
    id: story.id,
    ownerKey: `mock:${story.name}`,
    name: story.name,
    image: story.image,
    avatar: story.image,
    caption: index === 0 ? "Sunny window watch and snack dreams." : "A little daily cat moment.",
    likes: 12 + index * 3,
    views: 40 + index * 9,
    isApiStory: false
  }));
}

function mapApiStory(story: ApiStory): StoryItem {
  return {
    id: story.id,
    ownerKey: story.author?.id ?? `api:${story.id}`,
    name: story.author?.name ?? story.author?.username ?? "PawPal",
    image: story.url,
    avatar: story.author?.avatarUrl ?? story.url,
    caption: story.caption ?? "Shared a new story.",
    likes: story._count?.likes ?? 0,
    views: story._count?.views ?? 0,
    isApiStory: true
  };
}

export default function StoriesPage() {
  const router = useRouter();
  const storyTouchStart = useRef<{ x: number; y: number } | null>(null);
  const [status, setStatus] = useState("");
  const [storyItems, setStoryItems] = useState<StoryItem[]>(() => initialStories());
  const [visibleStoryCount, setVisibleStoryCount] = useState(4);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [likedStories, setLikedStories] = useState<Set<string>>(() => new Set());
  const [showAddStory, setShowAddStory] = useState(false);
  const [storyFile, setStoryFile] = useState<File | null>(null);
  const [storyPreview, setStoryPreview] = useState("");
  const [storyCaption, setStoryCaption] = useState("");
  const [isPostingStory, setIsPostingStory] = useState(false);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, string[]>>(() => ({
    [mockPosts[2].id]: ["This is too real.", "Treats solve everything."],
    [mockPosts[1].id]: ["Box castle champion."]
  }));
  const [commentPost, setCommentPost] = useState<DisplayPost | null>(null);
  const [commentText, setCommentText] = useState("");
  const [optionsPost, setOptionsPost] = useState<DisplayPost | null>(null);
  const [showOwnStoryNotice, setShowOwnStoryNotice] = useState(false);
  const [storySlideDirection, setStorySlideDirection] = useState<1 | -1>(1);

  useEffect(() => {
    async function loadStories() {
      let userId: string | null = null;

      try {
        const auth = await apiFetch<{ user: { id: string } }>("/api/auth/me");
        userId = auth.user.id;
      } catch {
        userId = null;
      }

      try {
        const items = await apiFetch<ApiStory[]>("/api/stories?limit=12");
        const publicStories = userId ? items.filter((story) => story.author?.id !== userId) : items;
        if (publicStories.length) setStoryItems([...publicStories.map(mapApiStory), ...initialStories()]);
      } catch {
        // Mock stories are already loaded.
      }
    }

    void loadStories();
  }, []);

  const visibleStories = useMemo(
    () => storyItems.slice(0, Math.min(visibleStoryCount, storyItems.length)),
    [storyItems, visibleStoryCount]
  );
  const activeStory = activeStoryIndex === null ? null : storyItems[activeStoryIndex];
  const activeStoryGroup = useMemo(
    () => (activeStory ? storyItems.filter((story) => story.ownerKey === activeStory.ownerKey) : []),
    [activeStory, storyItems]
  );
  const activeStoryGroupIndex = activeStory
    ? activeStoryGroup.findIndex((story) => story.id === activeStory.id)
    : -1;

  function selectStoryFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (storyPreview.startsWith("blob:")) URL.revokeObjectURL(storyPreview);
    setStoryFile(file);
    setStoryPreview(file ? URL.createObjectURL(file) : "");
  }

  function closeAddStory() {
    if (storyPreview.startsWith("blob:")) URL.revokeObjectURL(storyPreview);
    setStoryFile(null);
    setStoryPreview("");
    setStoryCaption("");
    setShowAddStory(false);
  }

  async function postStory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    try {
      requireSignedIn();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Please log in to post stories.");
      return;
    }

    if (!storyFile || !storyPreview) {
      setStatus("Choose a photo first");
      return;
    }

    setIsPostingStory(true);
    try {
      const uploadForm = new FormData();
      uploadForm.append("file", storyFile);
      uploadForm.append("folder", "stories");
      const upload = await apiFetch<{ url: string }>("/api/uploads", {
        method: "POST",
        body: uploadForm
      });
      await apiFetch<{ story: ApiStory }>("/api/stories", {
        method: "POST",
        body: JSON.stringify({
          url: upload.url,
          type: "IMAGE",
          caption: storyCaption.trim() || undefined
        })
      });
      closeAddStory();
      setStatus("Story posted. View your own story from Profile.");
      setShowOwnStoryNotice(true);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not post story");
    } finally {
      setIsPostingStory(false);
    }
  }

  function openStory(storyId: string) {
    const index = storyItems.findIndex((story) => story.id === storyId);
    if (index === -1) return;

    const story = storyItems[index];
    setActiveStoryIndex(index);
    setStoryItems((current) =>
      current.map((item) => (item.id === story.id ? { ...item, views: item.views + 1 } : item))
    );
    if (story.isApiStory) {
      void apiFetch(`/api/stories/${story.id}/view`, { method: "POST" }).catch(() => undefined);
    }
  }

  function moveStory(direction: -1 | 1) {
    setActiveStoryIndex((current) => {
      if (current === null) return current;
      const currentStory = storyItems[current];
      const group = storyItems.filter((story) => story.ownerKey === currentStory.ownerKey);
      if (group.length <= 1) return current;

      const groupIndex = group.findIndex((story) => story.id === currentStory.id);
      const nextStory = group[(groupIndex + direction + group.length) % group.length];
      const nextIndex = storyItems.findIndex((story) => story.id === nextStory.id);
      return nextIndex === -1 ? current : nextIndex;
    });
  }

  function moveStoryAccount(direction: -1 | 1) {
    setActiveStoryIndex((current) => {
      if (current === null) return current;
      const ownerKeys = Array.from(new Set(storyItems.map((story) => story.ownerKey)));
      if (ownerKeys.length <= 1) return current;

      const currentOwner = storyItems[current].ownerKey;
      const ownerIndex = ownerKeys.indexOf(currentOwner);
      const nextOwner = ownerKeys[(ownerIndex + direction + ownerKeys.length) % ownerKeys.length];
      const nextIndex = storyItems.findIndex((story) => story.ownerKey === nextOwner);
      if (nextIndex !== -1 && nextIndex !== current) setStorySlideDirection(direction);
      return nextIndex === -1 ? current : nextIndex;
    });
  }

  function startStorySwipe(event: TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0];
    storyTouchStart.current = { x: touch.clientX, y: touch.clientY };
  }

  function finishStorySwipe(event: TouchEvent<HTMLDivElement>) {
    const start = storyTouchStart.current;
    storyTouchStart.current = null;
    if (!start) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < 55 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return;

    moveStoryAccount(deltaX < 0 ? 1 : -1);
  }

  function toggleStoryLike(story: StoryItem) {
    try {
      requireSignedIn();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Please log in to like stories.");
      return;
    }

    setLikedStories((current) => {
      const next = new Set(current);
      const liked = next.has(story.id);
      if (liked) {
        next.delete(story.id);
      } else {
        next.add(story.id);
      }
      setStoryItems((items) =>
        items.map((item) =>
          item.id === story.id ? { ...item, likes: Math.max(0, item.likes + (liked ? -1 : 1)) } : item
        )
      );
      return next;
    });
    if (story.isApiStory) {
      void apiFetch(`/api/stories/${story.id}/like`, { method: "POST" }).catch(() => undefined);
    }
  }

  function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!commentPost || !commentText.trim()) return;
    try {
      requireSignedIn();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Please log in to comment.");
      return;
    }
    setCommentsByPost((current) => ({
      ...current,
      [commentPost.id]: [...(current[commentPost.id] ?? []), commentText.trim()]
    }));
    setCommentText("");
    setStatus("Comment added");
  }

  function copyPostLink(post: DisplayPost) {
    const link = `${window.location.origin}/stories#${post.id}`;
    void navigator.clipboard?.writeText(link).catch(() => undefined);
    setStatus("Post link copied");
    setOptionsPost(null);
  }

  function openComments(post: DisplayPost) {
    try {
      requireSignedIn();
      setCommentPost(post);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Please log in to comment.");
    }
  }

  function openPostOptions(post: DisplayPost) {
    try {
      requireSignedIn();
      setOptionsPost(post);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Please log in to use post options.");
    }
  }

  function openAddStory() {
    try {
      requireSignedIn();
      setShowAddStory(true);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Please log in to add stories.");
    }
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#fff8ef] pb-28 pt-7">
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-40 w-56 rounded-[48%] bg-paw-lilac/60" />
      <div className="pointer-events-none absolute -bottom-20 -right-16 h-44 w-56 rounded-[48%] bg-paw-lilac/60" />
      <PawPrint className="pointer-events-none absolute left-4 top-[320px] h-12 w-12 rotate-[-10deg] fill-paw-peach/20 text-paw-peach/20" />
      <PawPrint className="pointer-events-none absolute right-5 top-[680px] h-12 w-12 rotate-12 fill-paw-peach/20 text-paw-peach/20" />

      <div className="relative mx-4 mb-5 rounded-[28px] bg-white/74 px-4 pb-4 pt-4 shadow-[0_18px_45px_rgba(122,81,63,0.09)]">
        <header className="mb-5 flex items-center justify-between gap-2">
          <h1 className="flex min-w-0 items-center gap-1 whitespace-nowrap text-[27px] font-black leading-tight text-paw-ink min-[390px]:text-[29px]">
            <span>Stories & Memes</span>
            <PawPrint className="h-7 w-7 shrink-0 fill-paw-pink/55 text-paw-pink" />
            <Sparkles className="h-4 w-4 shrink-0 fill-paw-butter text-paw-butter" />
          </h1>
          <Link href="/home" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/80 text-paw-cocoa shadow-[0_10px_24px_rgba(122,81,63,0.12)]" aria-label="Close stories">
            <X size={25} strokeWidth={3} />
          </Link>
        </header>

        <div className="hide-scrollbar flex gap-3 overflow-x-auto pb-1">
          <button type="button" className="w-[64px] shrink-0 text-center" onClick={openAddStory}>
            <span className="mx-auto grid h-[62px] w-[62px] place-items-center rounded-full bg-gradient-to-br from-paw-lavender to-paw-pink p-[4px] shadow-soft ring-[4px] ring-white">
              <span className="grid h-full w-full place-items-center rounded-full bg-paw-lavender text-white">
                <Plus size={30} strokeWidth={2.5} />
              </span>
            </span>
            <span className="mt-2 block truncate text-center text-xs font-black leading-none text-paw-pink">
              Add Story
            </span>
          </button>
          {visibleStories.map((story) => (
            <button key={story.id} type="button" className="w-[64px] shrink-0 text-center" onClick={() => openStory(story.id)}>
              <span className="relative mx-auto block h-[62px] w-[62px] rounded-full bg-gradient-to-br from-paw-pink to-paw-lavender p-[3px] shadow-soft ring-[4px] ring-white">
                <img src={story.image} alt={story.name} className="h-full w-full rounded-full object-cover" />
                <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-white text-paw-pink shadow-soft">
                  <PawPrint className="h-4 w-4 fill-paw-pink/40" />
                </span>
              </span>
              <span className="mt-2 block truncate text-center text-xs font-black leading-none text-paw-cocoa">
                {story.name}
              </span>
            </button>
          ))}
          {visibleStoryCount < storyItems.length ? (
            <button
              className="grid h-[62px] w-[62px] shrink-0 place-items-center rounded-full bg-white/80 text-paw-cocoa shadow-soft"
              type="button"
              onClick={() => setVisibleStoryCount((current) => Math.min(current + 4, storyItems.length))}
              aria-label="Load more stories"
            >
              <MoreHorizontal size={23} />
            </button>
          ) : null}
        </div>
      </div>

      {showOwnStoryNotice ? (
        <div className="mx-5 mb-4 rounded-2xl border border-paw-peach/70 bg-white/70 p-4">
          <p className="text-sm font-extrabold leading-relaxed text-paw-cocoa">
            Your story was posted. Own stories are hidden here; view them from your profile.
          </p>
          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="mt-3 h-10 rounded-xl bg-paw-pink px-5 text-sm font-extrabold text-white shadow-soft"
          >
            Go to Profile
          </button>
        </div>
      ) : null}

      <StatusToast message={status} onDismiss={() => setStatus("")} />
      <div className="relative space-y-4 px-4">
        {[mockPosts[2], mockPosts[1]].map((post, index) => (
          <article key={post.id} className="relative overflow-hidden rounded-[28px] bg-white/86 p-4 shadow-[0_18px_45px_rgba(122,81,63,0.1)]">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <img src={post.avatar} alt={post.user} className="h-10 w-10 rounded-full object-cover ring-[3px] ring-paw-rose/40" />
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-black leading-tight text-paw-ink">
                    {post.user} <PawPrint className="inline h-4 w-4 fill-paw-pink/50 text-paw-pink" />
                  </h2>
                  <p className="text-xs font-bold text-paw-cocoa/65">
                    {post.time} <span className="text-paw-pink">•</span>
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => openPostOptions(post)} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-paw-cocoa" aria-label="Post options">
                <MoreHorizontal size={22} />
              </button>
            </div>
            <p className="mb-3 text-base font-black leading-snug text-paw-ink">
              {post.text} <Heart className="inline h-4 w-4 fill-paw-rose text-paw-rose" />
            </p>
            {post.image ? (
              <div className="relative">
                <img
                  src={post.image}
                  alt=""
                  className={`w-full rounded-[22px] object-cover ${index === 1 ? "h-[180px]" : "h-[205px]"}`}
                />
                <Sparkles className="absolute bottom-3 left-3 h-6 w-6 fill-paw-butter text-paw-butter drop-shadow" />
                <Heart className="absolute -right-2 -top-3 h-8 w-8 rotate-[-15deg] fill-paw-rose text-paw-rose" />
              </div>
            ) : null}
            <div className="mt-3 flex items-center justify-between rounded-[20px] bg-paw-blush/35 px-4 py-2.5 text-paw-ink">
              <div className="flex items-center gap-6 text-sm font-black">
                <button type="button" className="inline-flex items-center gap-2" onClick={() => setStatus("Like updated")}>
                  <Heart size={22} className="fill-paw-pink text-paw-pink" />
                  {post.likes}
                </button>
                <button type="button" className="inline-flex items-center gap-2" onClick={() => openComments(post)}>
                  <MessageCircle size={22} />
                  {commentsByPost[post.id]?.length ?? post.comments}
                </button>
              </div>
              <button type="button" onClick={() => setStatus("Saved posts updated")} className="text-paw-cocoa" aria-label="Save post">
                <Bookmark size={24} />
              </button>
            </div>
          </article>
        ))}
      </div>

      {showAddStory ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-paw-ink/35 px-5 backdrop-blur-sm">
          <form
            onSubmit={postStory}
            className="w-full max-w-[380px] rounded-[28px] border border-white/80 bg-[#fff8ef] p-6 shadow-[0_24px_70px_rgba(58,38,38,0.25)]"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[34px] font-black leading-none text-paw-ink">Add Story</h2>
                <p className="mt-3 text-lg font-bold leading-none text-paw-cocoa/80">Share a moment with your friends</p>
              </div>
              <button
                type="button"
                onClick={closeAddStory}
                className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white/90 text-paw-ink shadow-soft"
                aria-label="Close add story"
              >
                <X size={30} strokeWidth={3} />
              </button>
            </div>

            <label className="mb-5 grid min-h-[230px] cursor-pointer place-items-center overflow-hidden rounded-[28px] border-[2px] border-dashed border-paw-rose/65 bg-[#fffaf5] p-5 text-center shadow-[0_12px_34px_rgba(122,81,63,0.08)]">
              {storyPreview ? (
                <img src={storyPreview} alt="" className="h-full max-h-[240px] w-full rounded-[22px] object-cover" />
              ) : (
                <span className="grid place-items-center">
                  <span className="relative mb-5 grid h-24 w-24 place-items-center rounded-full bg-paw-blush text-paw-pink shadow-soft">
                    <ImageIcon size={48} strokeWidth={2.5} />
                    <span className="absolute right-1 top-2 grid h-11 w-11 place-items-center rounded-full bg-paw-pink text-white ring-[5px] ring-white">
                      <Plus size={27} strokeWidth={3} />
                    </span>
                    <Sparkles className="absolute -right-9 top-8 h-5 w-5 fill-paw-rose/45 text-paw-rose/45" />
                    <Sparkles className="absolute -left-8 top-8 h-4 w-4 fill-paw-rose/45 text-paw-rose/45" />
                  </span>
                  <span className="text-[22px] font-black leading-tight text-paw-ink">Choose story photo</span>
                  <span className="mt-3 text-base font-bold text-paw-cocoa/72">Add a photo or video to share</span>
                  <span className="mt-5 inline-flex h-12 items-center gap-3 rounded-full bg-white px-6 text-base font-black text-paw-pink shadow-soft">
                    <ImagePlus size={23} />
                    Select from gallery
                  </span>
                </span>
              )}
              <input type="file" accept="image/*" onChange={selectStoryFile} className="hidden" />
            </label>

            <label className="mb-4 block text-base font-black text-paw-cocoa">
              Write a caption
              <span className="relative mt-2 block">
                <textarea
                  value={storyCaption}
                  onChange={(event) => setStoryCaption(event.target.value)}
                  maxLength={200}
                  className="min-h-[92px] w-full resize-none rounded-[22px] border border-paw-cocoa/12 bg-white px-5 py-4 pr-20 text-base font-bold text-paw-ink outline-none transition focus:border-paw-pink/60 focus:shadow-[0_0_0_4px_rgba(247,101,137,0.13)]"
                  placeholder="What's on your mind?"
                />
                <span className="pointer-events-none absolute bottom-4 right-5 text-base font-black text-paw-pink">
                  {storyCaption.length}/200
                </span>
              </span>
            </label>

            <button
              type="submit"
              disabled={isPostingStory}
              className="mt-2 h-16 w-full rounded-[22px] bg-gradient-to-r from-paw-rose to-paw-pink text-xl font-black text-white shadow-[0_14px_30px_rgba(247,101,137,0.25)] disabled:opacity-70"
            >
              {isPostingStory ? "Posting..." : "Post Story"}
              <Sparkles className="ml-3 inline h-6 w-6 fill-white text-white" />
            </button>
          </form>
        </div>
      ) : null}

      {activeStory ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-[#6d9ed0]/75 px-5 py-8 text-white backdrop-blur-sm">
          <div
            key={activeStory.ownerKey}
            className={`relative h-[84vh] max-h-[690px] w-full max-w-[360px] touch-pan-y overflow-hidden rounded-[24px] bg-[#052a47] shadow-[0_20px_48px_rgba(10,35,60,0.42)] ${
              storySlideDirection === 1 ? "animate-[story-slide-left_260ms_ease-out]" : "animate-[story-slide-right_260ms_ease-out]"
            }`}
            onTouchStart={startStorySwipe}
            onTouchEnd={finishStorySwipe}
          >
            <div className="absolute inset-0">
              <img src={activeStory.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-[#002c4f]/88 via-transparent to-black/78" />
            </div>

            <div className="absolute left-5 right-5 top-5 z-10 flex gap-1.5">
              {activeStoryGroup.map((story, index) => (
                <span key={story.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/55">
                  <span
                    className={`block h-full rounded-full ${
                      index <= activeStoryGroupIndex ? "w-full bg-paw-pink" : "w-0 bg-paw-pink"
                    }`}
                  />
                </span>
              ))}
            </div>

            <div className="absolute left-5 right-5 top-10 z-10 flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-white to-paw-pink p-[3px] shadow-soft">
                  <img src={activeStory.avatar} alt={activeStory.name} className="h-full w-full rounded-full object-cover" />
                </span>
                <div className="min-w-0 pt-1">
                  <h2 className="flex min-w-0 items-center gap-1.5 text-xl font-black leading-none drop-shadow">
                    <span className="truncate">{activeStory.name}</span>
                    <PawPrint className="h-6 w-6 shrink-0 fill-paw-pink text-paw-pink" />
                  </h2>
                  <p className="mt-1.5 text-sm font-black leading-none text-white drop-shadow">{activeStory.views} views</p>
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
              onClick={() => moveStory(-1)}
              className="absolute left-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-white/16 text-white backdrop-blur-sm"
              aria-label="Previous story"
            >
              <ChevronLeft size={28} strokeWidth={3} />
            </button>
            <button
              type="button"
              onClick={() => moveStory(1)}
              className="absolute right-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-white/16 text-white backdrop-blur-sm"
              aria-label="Next story"
            >
              <ChevronRight size={28} strokeWidth={3} />
            </button>

            <div className="absolute bottom-5 left-5 right-5 z-10">
              <div className="mb-4 max-w-[270px]">
                <p className="text-lg font-black leading-snug drop-shadow">
                  <span className="mr-1.5 align-top text-4xl leading-none text-paw-pink">“</span>
                  {activeStory.caption} <Heart className="inline h-5 w-5 fill-paw-pink text-paw-pink" />
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleStoryLike(activeStory)}
                className="mb-4 inline-flex h-[52px] items-center gap-3 rounded-[18px] bg-black/35 px-5 text-xl font-black shadow-soft backdrop-blur-sm"
              >
                <Heart size={30} className={`text-paw-pink ${likedStories.has(activeStory.id) ? "fill-paw-pink" : "fill-paw-pink"}`} />
                {activeStory.likes}
              </button>
              <div className="flex items-center gap-3">
                <button type="button" className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-black/35 text-white backdrop-blur-sm" aria-label="Camera">
                  <Camera size={24} fill="white" />
                </button>
                <input
                  className="h-12 min-w-0 flex-1 rounded-full border border-white/18 bg-black/30 px-5 text-sm font-bold text-white outline-none backdrop-blur-sm placeholder:text-white/80"
                  placeholder="Send message..."
                />
                <button type="button" className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/15 bg-black/30 text-white backdrop-blur-sm" aria-label="Send message">
                  <Send size={24} fill="white" />
                </button>
              </div>
            </div>

            <div className="pointer-events-none absolute bottom-28 right-7 z-10 grid gap-2.5">
              <Heart className="h-6 w-6 fill-paw-pink text-paw-pink" />
              <Heart className="h-6 w-6 fill-paw-rose/75 text-paw-rose/75" />
              <Heart className="h-6 w-6 fill-paw-lavender/55 text-paw-lavender/55" />
            </div>
          </div>
        </div>
      ) : null}

      {commentPost ? (
        <div className="fixed inset-x-0 bottom-0 z-[60] mx-auto max-w-[430px] rounded-t-[28px] bg-paw-cream p-5 shadow-paw">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black">Comments</h2>
            <button type="button" onClick={() => setCommentPost(null)} className="grid h-9 w-9 place-items-center rounded-full bg-white/70" aria-label="Close comments">
              <X size={18} />
            </button>
          </div>
          <div className="mb-4 max-h-44 space-y-3 overflow-y-auto">
            {(commentsByPost[commentPost.id] ?? []).map((comment, index) => (
              <p key={`${comment}-${index}`} className="rounded-2xl bg-white/70 px-4 py-3 text-sm font-bold text-paw-cocoa">
                {comment}
              </p>
            ))}
          </div>
          <form onSubmit={submitComment} className="flex gap-2">
            <input
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              className="paw-input h-11 min-w-0 flex-1 rounded-xl px-4 text-sm font-bold"
              placeholder="Add a comment..."
            />
            <button type="submit" className="grid h-11 w-11 place-items-center rounded-xl bg-paw-pink text-white" aria-label="Send comment">
              <Send size={18} />
            </button>
          </form>
        </div>
      ) : null}

      {optionsPost ? (
        <div className="fixed inset-0 z-[60] grid place-items-end bg-paw-ink/25 backdrop-blur-sm">
          <div className="w-full max-w-[430px] rounded-t-[28px] bg-paw-cream p-5 shadow-paw">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black">Post Options</h2>
              <button type="button" onClick={() => setOptionsPost(null)} className="grid h-9 w-9 place-items-center rounded-full bg-white/70" aria-label="Close options">
                <X size={18} />
              </button>
            </div>
            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => {
                  setStatus(`Viewing ${optionsPost.user}'s profile`);
                  setOptionsPost(null);
                }}
                className="h-11 rounded-xl bg-white/70 text-sm font-extrabold text-paw-cocoa"
              >
                View Profile
              </button>
              <button type="button" onClick={() => copyPostLink(optionsPost)} className="h-11 rounded-xl bg-white/70 text-sm font-extrabold text-paw-cocoa">
                Copy Link
              </button>
              <button type="button" onClick={() => { setStatus("Post reported"); setOptionsPost(null); }} className="h-11 rounded-xl bg-white/70 text-sm font-extrabold text-paw-cocoa">
                Report Post
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <BottomNav />
    </section>
  );
}
