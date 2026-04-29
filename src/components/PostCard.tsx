import { Bookmark, Heart, MessageCircle, MoreHorizontal } from "lucide-react";
import type { posts } from "@/data/mockData";

type Post = (typeof posts)[number];

export function PostCard({ post, compact = false }: { post: Post; compact?: boolean }) {
  return (
    <article className="paw-card rounded-3xl p-4">
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
        <button className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/70" type="button">
          <MoreHorizontal size={18} />
        </button>
      </div>
      <p className="mb-3 text-sm font-bold leading-relaxed text-paw-ink">{post.text}</p>
      <img
        src={post.image}
        alt=""
        className={`w-full rounded-2xl object-cover ${compact ? "h-40" : "h-56"}`}
      />
      <div className="mt-3 flex items-center justify-between text-paw-ink">
        <div className="flex gap-4 text-xs font-extrabold">
          <button className="flex items-center gap-1" type="button">
            <Heart size={18} /> {post.likes}
          </button>
          <button className="flex items-center gap-1" type="button">
            <MessageCircle size={18} /> {post.comments}
          </button>
        </div>
        <button type="button" aria-label="Save post">
          <Bookmark size={18} />
        </button>
      </div>
    </article>
  );
}
