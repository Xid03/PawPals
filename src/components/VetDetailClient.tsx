"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Globe, Heart, MapPin, Phone, ShieldPlus, Star } from "lucide-react";
import { apiFetch, requireSignedIn, type ApiVet } from "@/lib/api-client";
import { vets as mockVets } from "@/data/mockData";

function serviceLabel(type: string) {
  return type
    .toLowerCase()
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function VetDetailClient({ id }: { id: string }) {
  const fallback = mockVets.find((item) => item.id === id) ?? mockVets[0];
  const [vet, setVet] = useState<ApiVet | null>(null);
  const [status, setStatus] = useState("");
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    apiFetch<{ vet: ApiVet }>(`/api/vets/${id}`)
      .then((data) => setVet(data.vet))
      .catch(() => undefined);
  }, [id]);

  const display = {
    name: vet?.name ?? fallback.name,
    image: vet?.imageUrl ?? "",
    address: vet?.address ?? fallback.distance,
    distance: vet?.city ?? fallback.distance,
    rating: vet?.rating ?? fallback.rating,
    reviews: vet?._count?.favorites ?? fallback.reviews,
    status: vet?.isOpen === false ? "Closed" : "Open",
    closes: vet?.openHours ?? fallback.closes,
    about: vet?.description ?? fallback.about,
    phone: fallback.phone,
    website: fallback.website,
    services: vet?.services?.map((service) => serviceLabel(service.type)) ?? fallback.services.map((service) => service.label)
  };
  const isGoogleLogo = display.image.includes("google.com/s2/favicons");
  const showImage = display.image && !imageFailed;

  async function favorite() {
    try {
      requireSignedIn();
      await apiFetch(`/api/vets/${id}/favorite`, { method: "POST" });
      setStatus("Favorite vets updated");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not favorite vet");
    }
  }

  async function book() {
    try {
      requireSignedIn();
      await apiFetch("/api/appointments", {
        method: "POST",
        body: JSON.stringify({
          vetId: id,
          startsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          reason: "Appointment requested from PawPals UI"
        })
      });
      setStatus("Appointment requested");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not request appointment");
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
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-paw-lilac to-paw-blush text-paw-lavender">
            <div className="text-center">
              <Building2 className="mx-auto mb-3" size={42} />
              <span className="text-2xl font-black">{initials(display.name)}</span>
            </div>
          </div>
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
        {status ? <p className="mt-3 text-xs font-extrabold text-paw-pink">{status}</p> : null}

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

        <button
          type="button"
          onClick={book}
          className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-paw-lavender px-5 py-3 text-sm font-extrabold text-white shadow-soft transition hover:brightness-105"
        >
          Book Appointment
        </button>
      </div>
    </section>
  );
}
