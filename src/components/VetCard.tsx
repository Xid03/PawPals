"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Star } from "lucide-react";

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

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function VetCard({ vet }: { vet: DisplayVet }) {
  const [imageFailed, setImageFailed] = useState(!vet.image);
  const isGoogleLogo = vet.image.includes("google.com/s2/favicons");
  const showImage = vet.image && !imageFailed;

  return (
    <Link href={`/vets/${vet.id}`} className="paw-card flex gap-3 rounded-3xl p-3">
      {showImage ? (
        <img
          src={vet.image}
          alt={vet.name}
          onError={() => setImageFailed(true)}
          className={`h-24 w-24 shrink-0 rounded-2xl ${isGoogleLogo ? "bg-white p-3 object-contain" : "object-cover"}`}
        />
      ) : (
        <div className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-paw-lilac to-paw-blush text-paw-lavender">
          <div className="text-center">
            <Building2 className="mx-auto mb-1" size={24} />
            <span className="text-sm font-black">{initials(vet.name)}</span>
          </div>
        </div>
      )}
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
