import { Heart, PawPrint, Sparkles, X } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { CatCard } from "@/components/CatCard";
import { PageHeader } from "@/components/PageHeader";
import { TagChip } from "@/components/TagChip";
import { cats } from "@/data/mockData";

export default function DiscoverPage() {
  const cat = cats[0];

  return (
    <section className="min-h-screen bg-paw-radial pb-28">
      <PageHeader title="Discover PawPals" action="search" />
      <div className="hide-scrollbar mb-4 flex gap-2 overflow-x-auto px-5">
        <TagChip active>Nearby</TagChip>
        <TagChip>Age</TagChip>
        <TagChip>Gender</TagChip>
        <TagChip>More Filters</TagChip>
      </div>
      <div className="px-5">
        <CatCard cat={cat} large />
        <div className="mt-6 grid grid-cols-3 items-center gap-5 px-5">
          <button className="grid h-14 w-14 place-items-center rounded-full bg-paw-lavender text-white shadow-soft" type="button">
            <X size={24} />
          </button>
          <button className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white text-paw-rose shadow-soft" type="button">
            <PawPrint className="fill-paw-peach" size={38} />
          </button>
          <button className="ml-auto grid h-14 w-14 place-items-center rounded-full bg-paw-pink text-white shadow-soft" type="button">
            <Heart className="fill-white" size={24} />
          </button>
        </div>
        <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-white/50 py-3 text-xs font-black text-paw-cocoa">
          <Sparkles size={16} className="text-paw-lavender" />
          Playdate-ready cats near you
        </div>
      </div>
      <BottomNav />
    </section>
  );
}
