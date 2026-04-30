"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, X } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { PostCard } from "@/components/PostCard";
import { StoryBubble } from "@/components/StoryBubble";
import { posts, stories } from "@/data/mockData";

export default function StoriesPage() {
  const [status, setStatus] = useState("");

  return (
    <section className="min-h-screen bg-paw-radial pb-28 pt-7">
      <header className="mb-5 flex items-center justify-between px-5">
        <h1 className="text-xl font-black">Stories & Memes</h1>
        <Link href="/home" className="grid h-10 w-10 place-items-center rounded-full bg-white/60" aria-label="Close stories">
          <X size={19} />
        </Link>
      </header>

      <div className="hide-scrollbar mb-5 flex gap-4 overflow-x-auto px-5">
        <StoryBubble name="Add Story" add onClick={() => setStatus("Story uploads can be connected through /api/stories and /api/uploads.")} />
        {stories.map((story) => (
          <StoryBubble key={story.id} name={story.name} image={story.image} onClick={() => setStatus(`Viewing ${story.name}'s story`)} />
        ))}
        <button
          className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-white/60"
          type="button"
          onClick={() => setStatus("More stories loaded")}
          aria-label="Load more stories"
        >
          <MoreHorizontal size={24} />
        </button>
      </div>

      {status ? <p className="mb-3 px-5 text-xs font-extrabold text-paw-pink">{status}</p> : null}
      <div className="space-y-4 px-5">
        <PostCard post={posts[2]} />
        <PostCard post={posts[1]} compact />
      </div>
      <BottomNav />
    </section>
  );
}
