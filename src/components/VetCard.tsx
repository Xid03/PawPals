import Link from "next/link";
import { Star } from "lucide-react";

export type DisplayVet = {
  id: string;
  name: string;
  image: string;
  distance: string;
  rating: string | number;
  reviews: number;
  status: string;
  closes: string;
};

export function VetCard({ vet }: { vet: DisplayVet }) {
  return (
    <Link href={`/vets/${vet.id}`} className="paw-card flex gap-3 rounded-3xl p-3">
      <img
        src={vet.image}
        alt={vet.name}
        className="h-24 w-24 shrink-0 rounded-2xl object-cover"
      />
      <div className="min-w-0 flex-1 py-1">
        <h3 className="truncate text-sm font-black text-paw-ink">{vet.name}</h3>
        <p className="mt-1 text-xs font-bold text-paw-cocoa/65">{vet.distance}</p>
        <p className="mt-1 flex items-center gap-1 text-xs font-extrabold text-paw-cocoa">
          <Star size={14} className="fill-[#FFB23F] text-[#FFB23F]" />
          {vet.rating} ({vet.reviews})
        </p>
        <p className="mt-2 text-xs font-extrabold">
          <span className="text-emerald-600">{vet.status}</span>
          <span className="text-paw-cocoa/60"> - {vet.closes}</span>
        </p>
      </div>
    </Link>
  );
}
