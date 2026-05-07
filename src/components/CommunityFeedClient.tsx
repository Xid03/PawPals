"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bookmark, Flame, Heart, MessageCircle, PawPrint, Plus, Search, Send, Users, X } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import type { DisplayPost } from "@/components/PostCard";
import { StatusToast } from "@/components/StatusToast";
import { apiFetch, isGuestMode, requireSignedIn, type ApiPost, type PublicUser } from "@/lib/api-client";
import bgArtwork from "../../images/bg.png";
import profileIcon from "../../images/profileIcon.png";

type ApiComment = {
  id: string;
  text: string;
  createdAt: string;
  author: PublicUser;
};

function mapPost(post: ApiPost): DisplayPost {
  return {
    id: post.id,
    user: post.author?.username ?? "PawPal",
    avatar: post.author?.avatarUrl ?? profileIcon.src,
    time: new Date(post.createdAt).toLocaleDateString(),
    text: post.text,
    image: post.images?.[0]?.url,
    likes: post._count?.likes ?? 0,
    comments: post._count?.comments ?? 0,
    savedByMe: post.savedByMe ?? false
  };
}

export function CommunityFeedClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetPostId = searchParams.get("postId") ?? "";
  const requestedMode = searchParams.get("mode");
  const initialMode = requestedMode === "saved" ? "saved" : "for-you";
  const [mode, setMode] = useState(initialMode);
  const [posts, setPosts] = useState<DisplayPost[]>([]);
  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [status, setStatus] = useState("");
  const [guest, setGuest] = useState(false);
  const [commentPost, setCommentPost] = useState<DisplayPost | null>(null);
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isClosingComments, setIsClosingComments] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const targetPostRef = useRef<HTMLElement | null>(null);
  const commentCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavedPostsView = mode === "saved";

  useEffect(() => {
    setMode(requestedMode === "saved" ? "saved" : "for-you");
  }, [requestedMode]);

  useEffect(() => {
    let ignore = false;

    setGuest(isGuestMode());
    setStatus("");
    apiFetch<ApiPost[]>(`/api/feed?mode=${mode}&limit=20`)
      .then(async (items) => {
        let nextPosts = items.map(mapPost);

        if (targetPostId && !nextPosts.some((post) => post.id === targetPostId)) {
          const data = await apiFetch<{ post: ApiPost }>(`/api/posts/${targetPostId}`);
          if (mode !== "saved" || data.post.savedByMe) {
            nextPosts = [mapPost(data.post), ...nextPosts];
          }
        }

        if (!ignore) {
          setPosts(nextPosts);
          setStatus(targetPostId ? "Opened the post from your notification." : "");
        }
      })
      .catch((error) => {
        if (!ignore) setStatus(error instanceof Error ? error.message : "Could not load posts");
      });

    return () => {
      ignore = true;
    };
  }, [mode, targetPostId]);

  useEffect(() => {
    if (!targetPostId) return;

    window.setTimeout(() => {
      targetPostRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
  }, [posts, targetPostId]);

  useEffect(() => {
    return () => {
      if (commentCloseTimerRef.current) {
        clearTimeout(commentCloseTimerRef.current);
      }
    };
  }, []);

  async function refreshPosts() {
    const items = await apiFetch<ApiPost[]>(`/api/feed?mode=${mode}&limit=20`);
    setPosts(items.map(mapPost));
  }

  async function toggleLike(postId: string) {
    try {
      requireSignedIn();
      const result = await apiFetch<{ liked: boolean }>(`/api/posts/${postId}/like`, { method: "POST" });
      setPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? { ...post, likes: Math.max(0, post.likes + (result.liked ? 1 : -1)) }
            : post
        )
      );
      setStatus(result.liked ? "Post liked" : "Like removed");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not update like");
    }
  }

  async function toggleSave(postId: string) {
    try {
      requireSignedIn();
      const result = await apiFetch<{ saved: boolean }>(`/api/posts/${postId}/save`, { method: "POST" });
      setPosts((current) =>
        mode === "saved" && !result.saved
          ? current.filter((post) => post.id !== postId)
          : current.map((post) => (post.id === postId ? { ...post, savedByMe: result.saved } : post))
      );
      setStatus(result.saved ? "Post saved" : "Post removed from saved");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not update saved post");
    }
  }

  async function openComments(post: DisplayPost) {
    if (commentCloseTimerRef.current) {
      clearTimeout(commentCloseTimerRef.current);
      commentCloseTimerRef.current = null;
    }
    setIsClosingComments(false);
    setCommentPost(post);
    setCommentText("");
    setComments([]);
    setStatus("");
    setIsLoadingComments(true);

    try {
      const items = await apiFetch<ApiComment[]>(`/api/posts/${post.id}/comments?limit=50`);
      setComments(items);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not load comments");
    } finally {
      setIsLoadingComments(false);
    }
  }

  function closeComments() {
    if (commentCloseTimerRef.current) {
      clearTimeout(commentCloseTimerRef.current);
    }
    setIsClosingComments(true);
    commentCloseTimerRef.current = setTimeout(() => {
      setCommentPost(null);
      setCommentText("");
      setIsClosingComments(false);
      commentCloseTimerRef.current = null;
    }, 180);
  }

  async function submitComment(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!commentPost) return;
    const text = commentText.trim();
    if (!text || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      requireSignedIn();
      const data = await apiFetch<{ comment: ApiComment }>(`/api/posts/${commentPost.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ text })
      });
      setComments((current) => [...current, data.comment]);
      setPosts((current) =>
        current.map((post) => (post.id === commentPost.id ? { ...post, comments: post.comments + 1 } : post))
      );
      setCommentPost((current) => (current ? { ...current, comments: current.comments + 1 } : current));
      setCommentText("");
      setStatus("Comment posted");
      closeComments();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not post comment");
    } finally {
      setIsSubmittingComment(false);
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
          {isSavedPostsView ? "Saved Posts" : "Community"} <PawPrint size={28} className="inline -translate-y-1 fill-paw-pink/25 text-paw-pink" />
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
      {!isSavedPostsView ? (
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
      ) : null}
      <StatusToast message={status} onDismiss={() => setStatus("")} />
      <div className="space-y-4">
        {visiblePosts.length ? visiblePosts.map((post) => (
          <article
            key={post.id}
            ref={post.id === targetPostId ? targetPostRef : undefined}
            id={`post-${post.id}`}
            className={`relative rounded-[24px] bg-white/86 p-4 shadow-soft transition ${
              post.id === targetPostId ? "ring-4 ring-paw-pink/35" : ""
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="relative shrink-0">
                <img src={post.avatar} alt={post.user} className="h-14 w-14 rounded-full object-cover ring-[3px] ring-white shadow-soft" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-black leading-tight text-paw-ink">{post.user}</h2>
                  <p className="mt-1 text-sm font-bold text-paw-cocoa/70">{post.time}</p>
                </div>
                <p className="mt-4 whitespace-pre-line text-base font-medium leading-relaxed text-paw-ink">{post.text}</p>
                {post.image ? <img src={post.image} alt="" className="mt-3 h-44 w-full rounded-2xl object-cover" /> : null}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-6 text-base font-bold">
                    <button type="button" onClick={() => toggleLike(post.id)} className="inline-flex items-center gap-2 text-paw-ink">
                      <Heart size={22} className={post.likes > 0 ? "fill-paw-pink text-paw-pink" : "text-paw-pink"} />
                      {post.likes}
                    </button>
                    <button type="button" className="inline-flex items-center gap-2 text-paw-ink" onClick={() => openComments(post)}>
                      <span className="text-paw-lavender">
                        <MessageCircle size={23} />
                      </span>
                      {post.comments}
                    </button>
                  </div>
                  <button type="button" onClick={() => toggleSave(post.id)} className="text-paw-lavender" aria-label={post.savedByMe ? "Remove saved post" : "Save post"}>
                    <Bookmark size={24} className={post.savedByMe ? "fill-paw-lavender" : ""} />
                  </button>
                </div>
              </div>
            </div>
          </article>
        )) : (
          <div className="rounded-[24px] bg-white/86 p-6 text-center shadow-soft">
            <PawPrint className="mx-auto h-12 w-12 fill-paw-pink/20 text-paw-pink" />
            <h2 className="mt-3 text-lg font-black text-paw-ink">
              {isSavedPostsView ? "No saved posts yet" : "No posts yet"}
            </h2>
            <p className="mt-2 text-sm font-bold text-paw-cocoa/70">
              {isSavedPostsView ? "Saved posts will appear here." : "Uploaded posts will appear here."}
            </p>
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
      {commentPost ? (
        <div
          className={`fixed inset-0 z-[60] grid place-items-end bg-paw-ink/25 px-4 pb-4 backdrop-blur-sm transition-opacity duration-200 md:place-items-center md:pb-0 ${
            isClosingComments ? "opacity-0" : "opacity-100"
          }`}
        >
          <section
            className={`w-full max-w-[430px] rounded-[28px] border border-paw-peach/70 bg-[#fff8ef] p-4 shadow-paw transition duration-200 ${
              isClosingComments ? "translate-y-4 scale-[0.98]" : "translate-y-0 scale-100"
            }`}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-xl font-black text-paw-ink">Comments</h2>
                <p className="truncate text-xs font-bold text-paw-cocoa/70">@{commentPost.user}</p>
              </div>
              <button
                type="button"
                onClick={closeComments}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-paw-cocoa shadow-soft"
                aria-label="Close comments"
              >
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[260px] space-y-3 overflow-y-auto pr-1">
              {isLoadingComments ? (
                <p className="rounded-2xl bg-white/75 px-4 py-5 text-center text-sm font-black text-paw-cocoa">Loading comments...</p>
              ) : comments.length ? (
                comments.map((comment) => (
                  <article key={comment.id} className="flex gap-3 rounded-2xl bg-white/80 p-3">
                    <img src={comment.author.avatarUrl || profileIcon.src} alt={comment.author.username} className="h-9 w-9 rounded-full object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-paw-ink">@{comment.author.username}</p>
                      <p className="mt-1 whitespace-pre-line text-sm font-bold leading-relaxed text-paw-cocoa">{comment.text}</p>
                    </div>
                  </article>
                ))
              ) : (
                <p className="rounded-2xl bg-white/75 px-4 py-5 text-center text-sm font-black text-paw-cocoa">No comments yet.</p>
              )}
            </div>
            <form className="mt-4 flex items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-soft" onSubmit={submitComment}>
              <input
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                placeholder="Write a comment..."
                className="min-w-0 flex-1 bg-transparent text-sm font-bold text-paw-ink outline-none placeholder:text-paw-cocoa/55"
                maxLength={600}
                disabled={isSubmittingComment}
              />
              <button
                type="submit"
                disabled={isSubmittingComment || !commentText.trim()}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-paw-pink text-white disabled:opacity-50"
                aria-label="Post comment"
              >
                <Send size={18} />
              </button>
            </form>
          </section>
        </div>
      ) : null}
      <BottomNav />
    </section>
  );
}
