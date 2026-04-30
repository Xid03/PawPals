"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Heart, ImagePlus, MoreHorizontal, Send, X } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { PostCard, type DisplayPost } from "@/components/PostCard";
import { StoryBubble } from "@/components/StoryBubble";
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
  name: string;
  image: string;
  caption: string;
  likes: number;
  views: number;
  isApiStory: boolean;
};

function initialStories(): StoryItem[] {
  return mockStories.map((story, index) => ({
    id: story.id,
    name: story.name,
    image: story.image,
    caption: index === 0 ? "Sunny window watch and snack dreams." : "A little daily cat moment.",
    likes: 12 + index * 3,
    views: 40 + index * 9,
    isApiStory: false
  }));
}

function mapApiStory(story: ApiStory): StoryItem {
  return {
    id: story.id,
    name: story.author?.name ?? story.author?.username ?? "PawPal",
    image: story.url,
    caption: story.caption ?? "Shared a new story.",
    likes: story._count?.likes ?? 0,
    views: story._count?.views ?? 0,
    isApiStory: true
  };
}

export default function StoriesPage() {
  const router = useRouter();
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
      return (current + direction + storyItems.length) % storyItems.length;
    });
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
    <section className="min-h-screen bg-paw-radial pb-28 pt-7">
      <header className="mb-5 flex items-center justify-between px-5">
        <h1 className="text-xl font-black">Stories & Memes</h1>
        <Link href="/home" className="grid h-10 w-10 place-items-center rounded-full bg-white/60" aria-label="Close stories">
          <X size={19} />
        </Link>
      </header>

      <div className="hide-scrollbar mb-5 flex gap-4 overflow-x-auto px-5">
        <StoryBubble name="Add Story" add onClick={openAddStory} />
        {visibleStories.map((story) => (
          <StoryBubble key={story.id} name={story.name} image={story.image} onClick={() => openStory(story.id)} />
        ))}
        {visibleStoryCount < storyItems.length ? (
          <button
            className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-white/60"
            type="button"
            onClick={() => setVisibleStoryCount((current) => Math.min(current + 4, storyItems.length))}
            aria-label="Load more stories"
          >
            <MoreHorizontal size={24} />
          </button>
        ) : null}
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

      {status ? <p className="mb-3 px-5 text-xs font-extrabold text-paw-pink">{status}</p> : null}
      <div className="space-y-4 px-5">
        {[mockPosts[2], mockPosts[1]].map((post, index) => (
          <PostCard
            key={post.id}
            post={{
              ...post,
              comments: commentsByPost[post.id]?.length ?? post.comments
            }}
            compact={index === 1}
            onComment={() => openComments(post)}
            onOptions={() => openPostOptions(post)}
          />
        ))}
      </div>

      {showAddStory ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-paw-ink/30 px-5 backdrop-blur-sm">
          <form onSubmit={postStory} className="w-full max-w-[360px] rounded-[24px] bg-paw-cream p-5 shadow-paw">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black">Add Story</h2>
              <button type="button" onClick={closeAddStory} className="grid h-9 w-9 place-items-center rounded-full bg-white/70" aria-label="Close add story">
                <X size={18} />
              </button>
            </div>
            <label className="mb-4 grid min-h-48 cursor-pointer place-items-center overflow-hidden rounded-2xl bg-white/70 text-paw-cocoa">
              {storyPreview ? (
                <img src={storyPreview} alt="" className="h-full max-h-64 w-full object-cover" />
              ) : (
                <span className="grid place-items-center gap-2 text-sm font-extrabold">
                  <ImagePlus size={32} />
                  Choose story photo
                </span>
              )}
              <input type="file" accept="image/*" onChange={selectStoryFile} className="hidden" />
            </label>
            <textarea
              value={storyCaption}
              onChange={(event) => setStoryCaption(event.target.value)}
              maxLength={280}
              className="paw-input mb-4 min-h-20 w-full resize-none rounded-2xl px-4 py-3 text-sm font-bold"
              placeholder="Write a caption..."
            />
            <button type="submit" disabled={isPostingStory} className="h-12 w-full rounded-xl bg-paw-pink text-sm font-extrabold text-white shadow-soft disabled:opacity-70">
              {isPostingStory ? "Posting..." : "Post Story"}
            </button>
          </form>
        </div>
      ) : null}

      {activeStory ? (
        <div className="fixed inset-0 z-[60] bg-paw-ink/80 px-5 py-7 text-white backdrop-blur-sm">
          <div className="mx-auto flex h-full max-w-[390px] flex-col">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black">{activeStory.name}</h2>
                <p className="text-xs font-extrabold text-white/75">{activeStory.views} views</p>
              </div>
              <button type="button" onClick={() => setActiveStoryIndex(null)} className="grid h-10 w-10 place-items-center rounded-full bg-white/15" aria-label="Close story">
                <X size={20} />
              </button>
            </div>
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-[24px] bg-black/20">
              <img src={activeStory.image} alt="" className="h-full w-full object-cover" />
              <button type="button" onClick={() => moveStory(-1)} className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/25" aria-label="Previous story">
                <ChevronLeft size={24} />
              </button>
              <button type="button" onClick={() => moveStory(1)} className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/25" aria-label="Next story">
                <ChevronRight size={24} />
              </button>
            </div>
            <div className="mt-4 rounded-2xl bg-white/12 p-4">
              <p className="text-sm font-extrabold leading-relaxed">{activeStory.caption}</p>
              <button type="button" onClick={() => toggleStoryLike(activeStory)} className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-white/15 px-4 text-sm font-extrabold">
                <Heart size={18} className={likedStories.has(activeStory.id) ? "fill-paw-pink text-paw-pink" : ""} />
                {activeStory.likes}
              </button>
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
