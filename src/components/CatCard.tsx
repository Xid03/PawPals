import Link from "next/link";
import { MapPin } from "lucide-react";
import type { cats } from "@/data/mockData";

type Cat = (typeof cats)[number];

export function CatCard({ cat, large = false }: { cat: Cat; large?: boolean }) {
  return (
    <Link
      href={`/cats/${cat.id}`}
      className={`group relative block overflow-hidden rounded-3xl ${
        large ? "h-[390px]" : "h-56"
      } bg-paw-blush shadow-soft`}
    >
      <img
        src={cat.image}
        alt={cat.name}
        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-paw-ink/78 to-transparent p-5 text-white">
        <h2 className="text-2xl font-black">{cat.name}</h2>
        <p className="text-sm font-bold">
          {cat.age} - {cat.breed}
        </p>
        <p className="mt-1 flex items-center gap-1 text-xs font-bold">
          <MapPin size={14} /> {cat.distance}
        </p>
      </div>
    </Link>
  );
}
