"use client";

import { useState } from "react";
import { Bookmark, Heart, MessageCircle, MoreHorizontal } from "lucide-react";
import { requireSignedIn } from "@/lib/api-client";

export type DisplayPost = {
  id: string;
  user: string;
  avatar: string;
  time: string;
  text: string;
  image?: string;
  likes: number;
  comments: number;
};

export function PostCard({
  post,
  compact = false,
  onLike,
  onComment,
  onSave,
  onOptions
}: {
  post: DisplayPost;
  compact?: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onSave?: () => void;
  onOptions?: () => void;
}) {
  const [likes, setLikes] = useState(post.likes);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const [showOptions, setShowOptions] = useState(false);

  function handleLike() {
    if (onLike) {
      onLike();
      return;
    }
    try {
      requireSignedIn();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Please log in to like posts.");
      return;
    }
    setLiked((current) => {
      setLikes((likesCurrent) => likesCurrent + (current ? -1 : 1));
      setMessage(current ? "Like removed" : "Liked");
      return !current;
    });
  }

  function handleComment() {
    if (onComment) {
      onComment();
      return;
    }
    try {
      requireSignedIn();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Please log in to comment.");
      return;
    }
    setMessage("Open the community page to join the conversation.");
  }

  function handleSave() {
    if (onSave) {
      onSave();
      return;
    }
    try {
      requireSignedIn();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Please log in to save posts.");
      return;
    }
    setSaved((current) => !current);
    setMessage(saved ? "Removed from saved posts" : "Saved post");
  }

  function handleOptions() {
    if (onOptions) {
      onOptions();
      return;
    }
    try {
      requireSignedIn();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Please log in to use post options.");
      return;
    }
    setShowOptions((current) => !current);
    setMessage("");
  }

  return (
    <article className="paw-card relative rounded-3xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={post.avatar}
            alt={post.user}
            className="h-10 w-10 rounded-full object-cover ring-2 ring-paw-peach"
          />
          <div>
            <h3 className="text-sm font-black text-paw-ink">{post.user}</h3>
            <p className="text-xs font-bold text-paw-cocoa/60">{post.time}</p>
          </div>
        </div>
        <button
          className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/70"
          type="button"
          onClick={handleOptions}
          aria-label="Post options"
        >
          <MoreHorizontal size={18} />
        </button>
      </div>
      {showOptions ? (
        <div className="absolute right-4 top-12 z-10 w-36 overflow-hidden rounded-2xl border border-paw-cocoa/10 bg-[#FFF8ED] text-left text-xs font-extrabold text-paw-cocoa shadow-soft">
          <button type="button" onClick={() => setMessage(`Viewing ${post.user}'s profile`)} className="block w-full px-4 py-3 text-left hover:bg-white/70">
            View profile
          </button>
          <button type="button" onClick={() => setMessage("Post link copied")} className="block w-full px-4 py-3 text-left hover:bg-white/70">
            Copy link
          </button>
          <button type="button" onClick={() => setMessage("Post reported")} className="block w-full px-4 py-3 text-left hover:bg-white/70">
            Report
          </button>
        </div>
      ) : null}
      <p className="mb-3 text-sm font-bold leading-relaxed text-paw-ink">{post.text}</p>
      {post.image ? (
        <img
          src={post.image}
          alt=""
          className={`w-full rounded-2xl object-cover ${compact ? "h-40" : "h-56"}`}
        />
      ) : null}
      <div className="mt-3 flex items-center justify-between text-paw-ink">
        <div className="flex gap-4 text-xs font-extrabold">
          <button className="flex items-center gap-1" type="button" onClick={handleLike}>
            <Heart size={18} className={liked || likes > post.likes ? "fill-paw-pink text-paw-pink" : ""} /> {likes}
          </button>
          <button className="flex items-center gap-1" type="button" onClick={handleComment}>
            <MessageCircle size={18} /> {post.comments}
          </button>
        </div>
        <button type="button" aria-label="Save post" onClick={handleSave}>
          <Bookmark size={18} className={saved ? "fill-paw-pink text-paw-pink" : ""} />
        </button>
      </div>
      {message ? <p className="mt-3 text-xs font-extrabold text-paw-cocoa/70">{message}</p> : null}
    </article>
  );
}
