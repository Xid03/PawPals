"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Globe, Heart, MapPin, Phone, ShieldPlus, Star } from "lucide-react";
import { StatusToast } from "@/components/StatusToast";
import { apiFetch, requireSignedIn, type ApiVet } from "@/lib/api-client";
import { vetPlaceholderImage } from "@/lib/vet-images";

function serviceLabel(type: string) {
  return type
    .toLowerCase()
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

export function VetDetailClient({ id }: { id: string }) {
  const [vet, setVet] = useState<ApiVet | null>(null);
  const [status, setStatus] = useState("");
  const [imageFailed, setImageFailed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ vet: ApiVet }>(`/api/vets/${id}`)
      .then((data) => setVet(data.vet))
      .catch((error) => setStatus(error instanceof Error ? error.message : "Could not load vet details."))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <section className="min-h-screen bg-paw-cream pb-7">
        <div className="relative h-56 overflow-hidden rounded-b-[2rem] bg-paw-blush">
          <Link href="/vets" className="absolute left-5 top-6 grid h-10 w-10 place-items-center rounded-full bg-white/75 text-paw-ink" aria-label="Go back">
            <ArrowLeft size={20} />
          </Link>
        </div>
        <div className="space-y-4 px-5 pt-5">
          <div className="h-6 w-44 animate-pulse rounded-full bg-paw-blush" />
          <div className="h-4 w-56 animate-pulse rounded-full bg-paw-blush/80" />
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-11 animate-pulse rounded-2xl bg-paw-lilac" />
            ))}
          </div>
          <div className="h-5 w-20 animate-pulse rounded-full bg-paw-blush" />
          <div className="h-4 w-full animate-pulse rounded-full bg-paw-blush/70" />
        </div>
      </section>
    );
  }

  if (!vet) {
    return (
      <section className="min-h-screen bg-paw-cream px-5 pb-7 pt-6">
        <StatusToast message={status} onDismiss={() => setStatus("")} />
        <Link href="/vets" className="grid h-10 w-10 place-items-center rounded-full bg-white/75 text-paw-ink" aria-label="Go back">
          <ArrowLeft size={20} />
        </Link>
        <div className="mt-20 rounded-[28px] bg-white/80 p-6 text-center shadow-soft">
          <h1 className="text-2xl font-black text-paw-ink">Clinic not found</h1>
          <p className="mt-2 text-sm font-bold text-paw-cocoa/70">This vet profile may have been removed.</p>
        </div>
      </section>
    );
  }

  const display = {
    name: vet.name,
    image: vet.imageUrl ?? vetPlaceholderImage({ id, name: vet.name, city: vet.city }),
    address: vet.address,
    distance: vet.city,
    rating: vet.rating,
    reviews: vet._count?.favorites ?? 0,
    status: vet.isOpen === false ? "Closed" : "Open",
    closes: vet.openHours ?? "",
    about: vet.description ?? "No extra details have been added for this clinic yet.",
    phone: "",
    website: null as string | null,
    services: vet.services?.map((service) => serviceLabel(service.type)) ?? []
  };
  const isGoogleLogo = display.image.includes("google.com/s2/favicons");
  const showImage = Boolean(display.image) && !imageFailed;

  async function favorite() {
    try {
      requireSignedIn();
      await apiFetch(`/api/vets/${id}/favorite`, { method: "POST" });
      setStatus("Favorite vets updated");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not favorite vet");
    }
  }

  function openVetAction(action: "call" | "directions" | "website") {
    const query = encodeURIComponent(`${display.name} ${display.address} Malaysia`);
    if (action === "call") {
      if (display.phone) {
        window.location.href = `tel:${display.phone}`;
        return;
      }
      window.open(`https://www.google.com/search?q=${query}+phone`, "_blank", "noopener,noreferrer");
      return;
    }
    const url =
      action === "directions"
        ? `https://www.google.com/maps/search/?api=1&query=${query}`
        : display.website ?? `https://www.google.com/search?q=${query}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <section className="min-h-screen bg-paw-cream pb-7">
      <div className="relative h-56 overflow-hidden rounded-b-[2rem]">
        {showImage ? (
          <img
            src={display.image}
            alt={display.name}
            onError={() => setImageFailed(true)}
            className={`h-full w-full ${isGoogleLogo ? "bg-white p-14 object-contain" : "object-cover"}`}
          />
        ) : (
          <img
            src={vetPlaceholderImage({ id, name: display.name, city: display.distance })}
            alt={display.name}
            className="h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-paw-ink/40 to-transparent" />
        <Link href="/vets" className="absolute left-5 top-6 grid h-10 w-10 place-items-center rounded-full bg-white/75 text-paw-ink" aria-label="Go back">
          <ArrowLeft size={20} />
        </Link>
        <button className="absolute right-5 top-6 grid h-10 w-10 place-items-center rounded-full bg-white/75 text-paw-ink" type="button" onClick={favorite}>
          <Heart size={19} />
        </button>
      </div>
      <div className="px-5 pt-5">
        <h1 className="text-xl font-black">{display.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-extrabold text-paw-cocoa">
          <span className="flex items-center gap-1">
            <MapPin size={14} /> {display.distance}
          </span>
          <span>-</span>
          <span className="text-emerald-600">{display.status}</span>
          <span>{display.closes}</span>
        </div>
        <p className="mt-2 text-xs font-bold leading-relaxed text-paw-cocoa/70">{display.address}</p>
        <p className="mt-2 flex items-center gap-1 text-sm font-black text-paw-cocoa">
          <Star size={16} className="fill-[#FFB23F] text-[#FFB23F]" />
          {display.rating} ({display.reviews} reviews)
        </p>
        <StatusToast message={status} onDismiss={() => setStatus("")} />

        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            { label: "Call", icon: Phone, action: "call" as const },
            { label: "Directions", icon: MapPin, action: "directions" as const },
            { label: "Website", icon: Globe, action: "website" as const }
          ].map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                onClick={() => openVetAction(action.action)}
                className="inline-flex h-11 items-center justify-center gap-1 rounded-2xl bg-paw-lavender px-3 text-xs font-extrabold text-white shadow-soft"
              >
                <Icon size={15} />
                {action.label}
              </button>
            );
          })}
        </div>

        <section className="mt-6">
          <h2 className="mb-2 text-sm font-black">About</h2>
          <p className="text-sm font-bold leading-relaxed text-paw-cocoa">{display.about}</p>
        </section>

        <section className="mt-6">
          <h2 className="mb-3 text-sm font-black">Services</h2>
          <div className="grid grid-cols-4 gap-3">
            {display.services.slice(0, 4).map((service) => (
              <div key={service} className="rounded-2xl bg-paw-lilac p-3 text-center text-paw-lavender">
                <ShieldPlus className="mx-auto mb-2" size={24} />
                <p className="text-[11px] font-extrabold text-paw-cocoa">{service}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
