import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MoreHorizontal, PawPrint } from "lucide-react";
import { PrimaryButton } from "@/components/PrimaryButton";
import { TagChip } from "@/components/TagChip";
import { cats } from "@/data/mockData";

export function generateStaticParams() {
  return cats.map((cat) => ({ id: cat.id }));
}

export default function CatProfilePage({ params }: { params: { id: string } }) {
  const cat = cats.find((item) => item.id === params.id);

  if (!cat) {
    notFound();
  }

  return (
    <section className="min-h-screen bg-paw-cream pb-7">
      <div className="relative h-[420px] overflow-hidden rounded-b-[2rem]">
        <img src={cat.image} alt={cat.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-paw-ink/70 via-transparent to-paw-ink/10" />
        <Link
          href="/discover"
          className="absolute left-5 top-6 grid h-10 w-10 place-items-center rounded-full bg-white/70 text-paw-ink"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </Link>
        <button className="absolute right-5 top-6 grid h-10 w-10 place-items-center rounded-full bg-white/70" type="button">
          <MoreHorizontal size={20} />
        </button>
        <div className="absolute bottom-6 left-6 text-white">
          <h1 className="text-3xl font-black">{cat.name}</h1>
          <p className="text-sm font-extrabold">
            {cat.age} - {cat.breed} - {cat.gender}
          </p>
          <p className="mt-1 text-sm font-bold">{cat.distance}</p>
        </div>
      </div>

      <div className="space-y-5 px-5 pt-5">
        <section>
          <h2 className="mb-2 text-sm font-black">About {cat.name}</h2>
          <p className="text-sm font-bold leading-relaxed text-paw-cocoa">{cat.about}</p>
        </section>
        <section>
          <h2 className="mb-2 text-sm font-black">Personality</h2>
          <div className="flex flex-wrap gap-2">
            {cat.personality.map((tag) => (
              <TagChip key={tag} tone="lavender">
                {tag}
              </TagChip>
            ))}
          </div>
        </section>
        <section>
          <h2 className="mb-2 text-sm font-black">Looking for</h2>
          <div className="flex flex-wrap gap-2">
            {cat.lookingFor.map((tag) => (
              <TagChip key={tag} tone="peach">
                {tag}
              </TagChip>
            ))}
          </div>
        </section>
        <PrimaryButton href="/chats" icon={<PawPrint size={20} />}>
          Send Meow
        </PrimaryButton>
      </div>
    </section>
  );
}
