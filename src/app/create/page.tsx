import { Plus, X } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { PrimaryButton } from "@/components/PrimaryButton";
import { TagChip } from "@/components/TagChip";
import { cats, currentUser } from "@/data/mockData";

export default function CreatePostPage() {
  return (
    <section className="min-h-screen bg-paw-radial pb-28 pt-7">
      <header className="mb-6 flex items-center justify-between px-5">
        <h1 className="text-xl font-black">Create Post</h1>
        <a href="/community" className="grid h-10 w-10 place-items-center rounded-full bg-white/60" aria-label="Close">
          <X size={19} />
        </a>
      </header>

      <div className="px-5">
        <section className="paw-card rounded-3xl p-4">
          <div className="mb-4 flex gap-3">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="h-11 w-11 rounded-full object-cover"
            />
            <textarea
              className="min-h-24 flex-1 resize-none bg-transparent pt-2 text-sm font-bold outline-none"
              placeholder="What's on your mind?"
            />
          </div>

          <h2 className="mb-3 text-sm font-black">Add Photos or Videos</h2>
          <div className="mb-6 flex gap-3">
            {cats.slice(0, 3).map((cat) => (
              <img
                key={cat.id}
                src={cat.image}
                alt={cat.name}
                className="h-20 w-20 rounded-2xl object-cover"
              />
            ))}
            <button className="grid h-20 w-20 place-items-center rounded-2xl bg-white/70 text-paw-cocoa" type="button">
              <Plus size={26} />
            </button>
          </div>

          <h2 className="mb-3 text-sm font-black">Add Topic</h2>
          <div className="mb-6 flex flex-wrap gap-2">
            {["Health", "Behavior", "Food", "General"].map((topic) => (
              <TagChip key={topic}>{topic}</TagChip>
            ))}
          </div>

          <div className="mb-6 flex items-center justify-between border-t border-paw-cocoa/10 pt-4">
            <span className="text-sm font-black">Audience</span>
            <button className="text-sm font-extrabold text-paw-cocoa/70" type="button">
              Public
            </button>
          </div>

          <PrimaryButton href="/community">Post</PrimaryButton>
        </section>
      </div>
      <BottomNav />
    </section>
  );
}
