"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, MapPin, Phone, Star } from "lucide-react";

export type DisplayVet = {
  id: string;
  name: string;
  image: string;
  distance: string;
  rating: string | number;
  reviews: number;
  status: string;
  closes: string;
  phone?: string;
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
    <article className="relative rounded-[24px] bg-white p-3.5 shadow-[0_12px_30px_rgba(137,91,77,0.065)]">
      <Link href={`/vets/${vet.id}`} className="flex min-w-0 gap-3 pr-10">
        {showImage ? (
          <img
            src={vet.image}
            alt={vet.name}
            onError={() => setImageFailed(true)}
            className={`h-20 w-20 shrink-0 rounded-[18px] ${
              isGoogleLogo ? "bg-white p-4 object-contain shadow-[inset_0_0_0_1px_rgba(122,81,63,0.04)]" : "object-cover"
            }`}
          />
        ) : (
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-[18px] bg-gradient-to-br from-paw-lilac to-paw-blush text-paw-lavender shadow-[inset_0_0_0_1px_rgba(255,255,255,0.45)]">
            <div className="text-center">
              <Building2 className="mx-auto mb-1" size={24} strokeWidth={2.4} />
              <span className="text-lg font-black">{initials(vet.name)}</span>
            </div>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-black leading-tight text-[#2f272a]">{vet.name}</h3>
          <p className="mt-1.5 flex items-center gap-1 text-xs font-bold text-[#9a837d]">
            <MapPin size={15} className="shrink-0 text-[#f76589]" />
            <span className="truncate">{vet.distance}</span>
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm font-black text-[#3d3031]">
            <Star size={17} className="shrink-0 fill-[#ffae2b] text-[#ffae2b]" />
            {vet.rating} ({vet.reviews})
          </p>
          <p className="mt-1.5 line-clamp-2 text-xs font-bold leading-relaxed text-[#9a837d]">
            <span className="rounded-md bg-[#e8fff7] px-1.5 py-0.5 font-black text-[#00a978]">{vet.status}</span>
            <span className="px-1 text-[#b9aaa5]">•</span>
            {vet.closes}
          </p>
        </div>
      </Link>
      <a
        href={vet.phone ? `tel:${vet.phone}` : `/vets/${vet.id}`}
        className="absolute right-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-[#ffe5ea] text-[#f76589] shadow-[0_10px_24px_rgba(247,101,137,0.13)]"
        aria-label={`Call ${vet.name}`}
      >
        <Phone size={19} fill="currentColor" />
      </a>
    </article>
  );
}
