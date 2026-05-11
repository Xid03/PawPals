"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Heart, MessageCircle, PawPrint, Send, Sparkles, X } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { StatusToast } from "@/components/StatusToast";
import { apiFetch, requireSignedIn, type ApiPost, type PublicUser } from "@/lib/api-client";
import profileIcon from "../../../images/profileIcon.png";

type MemePost = {
  id: string;
  user: string;
  username?: string;
  avatar: string;
  time: string;
  text: string;
  image?: string;
  mediaType: "image" | "video";
  likes: number;
  comments: number;
  likedByMe: boolean;
  savedByMe: boolean;
};

type MemeComment = {
  id: string;
  text: string;
  createdAt?: string;
  author?: PublicUser;
};

function mapMeme(post: ApiPost): MemePost {
  const mediaUrl = post.images?.[0]?.url;
  const isVideo = /\.(mp4|webm|ogg)(\?|$)/i.test(mediaUrl ?? "");
  return {
    id: post.id,
    user: post.author?.name ?? "PawPal",
    username: post.author?.username,
    avatar: post.author?.avatarUrl ?? profileIcon.src,
    time: new Date(post.createdAt).toLocaleDateString(),
    text: post.text,
    image: mediaUrl,
    mediaType: isVideo ? "video" : "image",
    likes: post._count?.likes ?? 0,
    comments: post._count?.comments ?? 0,
    likedByMe: Boolean(post.likedByMe),
    savedByMe: Boolean(post.savedByMe)
  };
}

export default function SavedMemesPage() {
  const router = useRouter();
  const [memes, setMemes] = useState<MemePost[]>([]);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [commentPost, setCommentPost] = useState<MemePost | null>(null);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, MemeComment[]>>({});
  const [commentText, setCommentText] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    let ignore = false;

    setIsLoading(true);
    apiFetch<ApiPost[]>("/api/feed?mode=saved&topic=MEMES&limit=50")
      .then((posts) => {
        if (!ignore) setMemes(posts.map(mapMeme));
      })
      .catch((error) => {
        if (!ignore) setStatus(error instanceof Error ? error.message : "Could not load saved memes");
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  async function toggleLike(post: MemePost) {
    try {
      requireSignedIn();
      const result = await apiFetch<{ liked: boolean }>(`/api/posts/${post.id}/like`, { method: "POST" });
      setMemes((current) =>
        current.map((item) =>
          item.id === post.id
            ? { ...item, likedByMe: result.liked, likes: Math.max(0, item.likes + (result.liked ? 1 : -1)) }
            : item
        )
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not update like");
    }
  }

  async function toggleSave(post: MemePost) {
    try {
      requireSignedIn();
      const result = await apiFetch<{ saved: boolean }>(`/api/posts/${post.id}/save`, { method: "POST" });
      if (result.saved) {
        setMemes((current) => current.map((item) => (item.id === post.id ? { ...item, savedByMe: true } : item)));
        setStatus("Meme saved");
      } else {
        setMemes((current) => current.filter((item) => item.id !== post.id));
        setStatus("Meme removed from saved memes");
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not update saved meme");
    }
  }

  async function openComments(post: MemePost) {
    try {
      requireSignedIn();
      setCommentPost(post);
      setIsLoadingComments(true);
      const comments = await apiFetch<MemeComment[]>(`/api/posts/${post.id}/comments?limit=50`);
      setCommentsByPost((current) => ({ ...current, [post.id]: comments }));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not load comments");
    } finally {
      setIsLoadingComments(false);
    }
  }

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!commentPost || !commentText.trim() || isSubmittingComment) return;

    try {
      requireSignedIn();
      setIsSubmittingComment(true);
      const result = await apiFetch<{ comment: MemeComment }>(`/api/posts/${commentPost.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ text: commentText.trim() })
      });
      setCommentsByPost((current) => ({
        ...current,
        [commentPost.id]: [...(current[commentPost.id] ?? []), result.comment]
      }));
      setMemes((current) =>
        current.map((post) => (post.id === commentPost.id ? { ...post, comments: post.comments + 1 } : post))
      );
      setCommentPost((current) => (current ? { ...current, comments: current.comments + 1 } : current));
      setCommentText("");
      setStatus("Comment added");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not add comment");
    } finally {
      setIsSubmittingComment(false);
    }
  }

  return (
    <section className="min-h-screen bg-[#fff7ef] pb-28 text-paw-ink">
      <div className="sticky top-0 z-20 border-b border-paw-peach/50 bg-[#fff7ef]/92 px-5 py-5 backdrop-blur">
        <div className="mx-auto flex max-w-[430px] items-center justify-between">
          <button type="button" onClick={() => router.back()} className="grid h-11 w-11 place-items-center rounded-full bg-white text-paw-pink shadow-soft" aria-label="Back">
            <X size={22} />
          </button>
          <h1 className="text-2xl font-black text-paw-ink">
            Saved Memes <PawPrint className="inline h-6 w-6 fill-paw-pink/25 text-paw-pink" />
          </h1>
          <span className="h-11 w-11" />
        </div>
      </div>

      <StatusToast message={status} onDismiss={() => setStatus("")} />

      <div className="mx-auto max-w-[430px] space-y-4 px-4 pt-5">
        {isLoading ? (
          <div className="rounded-[28px] bg-white/75 p-6 text-center text-sm font-black text-paw-cocoa shadow-soft">Loading saved memes...</div>
        ) : null}

        {!isLoading && !memes.length ? (
          <div className="rounded-[28px] border-2 border-dashed border-paw-pink/25 bg-white/78 p-6 text-center shadow-soft">
            <Bookmark className="mx-auto h-9 w-9 text-paw-pink" />
            <h2 className="mt-3 text-lg font-black text-paw-ink">No saved memes yet.</h2>
            <p className="mx-auto mt-2 max-w-[260px] text-sm font-bold leading-relaxed text-paw-cocoa/70">
              Memes you save will appear here.
            </p>
          </div>
        ) : null}

        {memes.map((post) => (
          <article key={post.id} className="relative overflow-hidden rounded-[28px] border-2 border-paw-pink/25 bg-gradient-to-br from-white via-[#fff5f8] to-[#fff0d8] p-4 shadow-[0_18px_45px_rgba(122,81,63,0.1)]">
            <div className="pointer-events-none absolute -right-7 -top-8 h-24 w-24 rounded-full bg-paw-butter/45" />
            <div className="mb-3 flex min-w-0 items-center gap-3">
              <img src={post.avatar} alt={post.user} className="h-10 w-10 rounded-full object-cover ring-[3px] ring-paw-butter" />
              <div className="min-w-0">
                <h2 className="truncate text-lg font-black leading-tight text-paw-ink">
                  {post.user} <PawPrint className="inline h-4 w-4 fill-paw-pink/50 text-paw-pink" />
                </h2>
                <p className="text-xs font-bold text-paw-cocoa/65">
                  {post.username ? `@${post.username}` : post.time} <span className="text-paw-pink">•</span>{" "}
                  <span className="rounded-full bg-paw-pink px-2 py-1 text-[10px] font-black uppercase text-white">Meme</span>
                </p>
              </div>
            </div>
            <p className="mb-3 rounded-2xl bg-white/55 px-3 py-2 text-base font-black leading-snug text-paw-ink">
              {post.text} <Heart className="inline h-4 w-4 fill-paw-rose text-paw-rose" />
            </p>
            {post.image ? (
              <div className="relative rounded-[24px] bg-white p-2 shadow-[0_12px_28px_rgba(247,101,137,0.12)]">
                {post.mediaType === "video" ? (
                  <video src={post.image} className="h-[215px] w-full rounded-[18px] object-cover" controls />
                ) : (
                  <img src={post.image} alt="" className="h-[215px] w-full rounded-[18px] object-cover" />
                )}
                <Sparkles className="absolute bottom-3 left-3 h-6 w-6 fill-paw-butter text-paw-butter drop-shadow" />
                <span className="absolute left-4 top-4 rounded-full bg-black/45 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white backdrop-blur-sm">
                  Meme post
                </span>
              </div>
            ) : null}
            <div className="mt-3 flex items-center justify-between rounded-[20px] bg-white/72 px-4 py-2.5 text-paw-ink">
              <div className="flex items-center gap-6 text-sm font-black">
                <button type="button" className="inline-flex items-center gap-2 transition active:scale-95" onClick={() => void toggleLike(post)} aria-pressed={post.likedByMe}>
                  <Heart size={22} className={post.likedByMe ? "fill-paw-pink text-paw-pink" : "text-paw-cocoa"} />
                  {post.likes}
                </button>
                <button type="button" className="inline-flex items-center gap-2" onClick={() => void openComments(post)}>
                  <MessageCircle size={22} />
                  {commentsByPost[post.id]?.length ?? post.comments}
                </button>
              </div>
              <button type="button" onClick={() => void toggleSave(post)} className="text-paw-pink" aria-label="Remove saved meme" aria-pressed={post.savedByMe}>
                <Bookmark size={24} className="fill-paw-pink" />
              </button>
            </div>
          </article>
        ))}
      </div>

      {commentPost ? (
        <div className="fixed inset-x-0 bottom-0 z-[60] mx-auto max-w-[430px] rounded-t-[28px] bg-paw-cream p-5 shadow-paw">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black">Comments</h2>
            <button type="button" onClick={() => setCommentPost(null)} className="grid h-9 w-9 place-items-center rounded-full bg-white/70" aria-label="Close comments">
              <X size={18} />
            </button>
          </div>
          <div className="mb-4 max-h-44 space-y-3 overflow-y-auto">
            {isLoadingComments ? <p className="rounded-2xl bg-white/70 px-4 py-3 text-sm font-bold text-paw-cocoa/70">Loading comments...</p> : null}
            {(commentsByPost[commentPost.id] ?? []).map((comment) => (
              <div key={comment.id} className="rounded-2xl bg-white/70 px-4 py-3 text-sm text-paw-cocoa">
                {comment.author ? <p className="mb-1 font-black text-paw-ink">@{comment.author.username}</p> : null}
                <p className="font-bold">{comment.text}</p>
              </div>
            ))}
            {!isLoadingComments && !(commentsByPost[commentPost.id] ?? []).length ? (
              <p className="rounded-2xl bg-white/70 px-4 py-3 text-sm font-bold text-paw-cocoa/70">No comments yet.</p>
            ) : null}
          </div>
          <form onSubmit={submitComment} className="flex gap-2">
            <input
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              className="paw-input h-11 min-w-0 flex-1 rounded-xl px-4 text-sm font-bold"
              placeholder="Add a comment..."
            />
            <button type="submit" disabled={isSubmittingComment || !commentText.trim()} className="grid h-11 w-11 place-items-center rounded-xl bg-paw-pink text-white disabled:opacity-55" aria-label="Send comment">
              <Send size={18} />
            </button>
          </form>
        </div>
      ) : null}

      <BottomNav />
    </section>
  );
}
