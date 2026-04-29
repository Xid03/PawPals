import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { PostCard } from "@/components/PostCard";
import { TagChip } from "@/components/TagChip";
import { posts } from "@/data/mockData";

export default function CommunityFeedPage() {
  return (
    <section className="relative min-h-screen bg-paw-radial pb-28">
      <PageHeader title="Community" />
      <button className="absolute right-5 top-7 grid h-10 w-10 place-items-center rounded-full bg-white/60" type="button">
        <Search size={19} />
      </button>
      <div className="mb-4 flex gap-2 px-5">
        <TagChip active>For You</TagChip>
        <TagChip>Following</TagChip>
        <TagChip>Trending</TagChip>
      </div>
      <div className="space-y-4 px-5">
        {posts.slice(0, 2).map((post) => (
          <PostCard key={post.id} post={post} />
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
