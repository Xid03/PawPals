"use client";

import { useEffect, useState } from "react";
import { Filter, PawPrint, Search, X } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { VetCard, type DisplayVet } from "@/components/VetCard";
import { apiFetch, type ApiVet } from "@/lib/api-client";
import { vets as mockVets } from "@/data/mockData";

function mapVet(vet: ApiVet): DisplayVet {
  const distance =
    typeof vet.distanceKm === "number"
      ? vet.distanceKm < 1
        ? `${Math.round(vet.distanceKm * 1000)} m away`
        : `${vet.distanceKm} km away`
      : vet.city;

  return {
    id: vet.id,
    name: vet.name,
    image: vet.imageUrl ?? mockVets[0].image,
    distance,
    rating: vet.rating.toFixed(1),
    reviews: vet._count?.favorites ?? 0,
    status: vet.isOpen ? "Open" : "Closed",
    closes: vet.openHours ?? "Hours unavailable"
  };
}

export function VetDirectoryClient() {
  const [query, setQuery] = useState("");
  const [apiVets, setApiVets] = useState<ApiVet[]>([]);
  const [openOnly, setOpenOnly] = useState(false);
  const [city, setCity] = useState("All");
  const [service, setService] = useState("All");
  const [minRating, setMinRating] = useState("0");
  const [showFilters, setShowFilters] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [status, setStatus] = useState("");
  const [subtitle, setSubtitle] = useState("Malaysia");

  useEffect(() => {
    const params = new URLSearchParams({ limit: "50" });
    const savedLocation = window.localStorage.getItem("pawpals_location");

    if (query) params.set("q", query);
    if (city !== "All") params.set("city", city);
    if (service !== "All") params.set("service", service);
    if (minRating !== "0") params.set("minRating", minRating);
    if (openOnly) params.set("open", "true");
    if (savedLocation) {
      try {
        const location = JSON.parse(savedLocation) as { lat: number; lng: number };
        params.set("lat", String(location.lat));
        params.set("lng", String(location.lng));
        setSubtitle("Malaysia - nearest first");
      } catch {
        window.localStorage.removeItem("pawpals_location");
      }
    }

    apiFetch<ApiVet[]>(`/api/vets?${params.toString()}`)
      .then((items) => {
        setHasLoaded(true);
        setApiVets(items);
        setStatus(items.length ? "" : "No clinics found. Try another city or service.");
      })
      .catch((error) => setStatus(error instanceof Error ? error.message : "Could not load vets"));
  }, [city, minRating, openOnly, query, service]);

  const cities = [
    "All",
    "Kuala Lumpur",
    "Petaling Jaya",
    "Subang Jaya",
    "Shah Alam",
    "Klang",
    "Putrajaya",
    "Johor Bahru",
    "Penang",
    "Ipoh",
    "Alor Setar",
    "Kangar",
    "Kota Bharu",
    "Kuala Terengganu",
    "Kuantan",
    "Melaka",
    "Seremban",
    "Kota Kinabalu",
    "Kuching",
    "Labuan"
  ];
  const services = [
    ["All", "All Services"],
    ["CHECKUP", "Checkup"],
    ["VACCINATION", "Vaccination"],
    ["DENTAL", "Dental"],
    ["SURGERY", "Surgery"],
    ["EMERGENCY", "Emergency"]
  ];
  const visibleVets = (hasLoaded ? apiVets.map(mapVet) : mockVets).filter((vet) => !openOnly || vet.status === "Open");
  const activeFilterCount = [openOnly, city !== "All", service !== "All", minRating !== "0"].filter(Boolean).length;

  function clearFilters() {
    setOpenOnly(false);
    setCity("All");
    setService("All");
    setMinRating("0");
  }

  return (
    <section className="min-h-screen bg-paw-radial pb-28">
      <PageHeader title="Vet Directory" subtitle={subtitle} backHref="/home" action="search" />
      <div className="px-5">
        <label className="paw-input mb-4 flex h-14 items-center gap-3 rounded-2xl px-4">
          <Search size={18} className="text-paw-cocoa" />
          <input
            placeholder="Search vets or clinics..."
            className="w-full bg-transparent text-sm font-bold outline-none"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowFilters((current) => !current)}
            className={`relative grid h-9 w-9 place-items-center rounded-full ${activeFilterCount ? "bg-paw-pink text-white" : "text-paw-cocoa"}`}
            aria-label="Open vet filters"
          >
            <Filter size={18} />
            {activeFilterCount ? (
              <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-paw-lavender text-[9px] font-black text-white">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
        </label>

        {showFilters ? (
          <section className="paw-card mb-4 rounded-3xl p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-black text-paw-ink">Filter Clinics</h2>
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/70 text-paw-ink"
                aria-label="Close filters"
              >
                <X size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setOpenOnly((current) => !current)}
              className={`mb-3 h-10 rounded-xl px-4 text-sm font-extrabold ${openOnly ? "bg-paw-pink text-white" : "bg-white/70 text-paw-cocoa"}`}
            >
              Open now
            </button>

            <label className="mb-3 block">
              <span className="mb-1 block text-xs font-black text-paw-cocoa/70">City</span>
              <select
                value={city}
                onChange={(event) => setCity(event.target.value)}
                className="h-11 w-full rounded-xl border border-paw-cocoa/10 bg-white/80 px-3 text-sm font-bold outline-none"
              >
                {cities.map((item) => (
                  <option key={item} value={item}>
                    {item === "All" ? "All Malaysia" : item}
                  </option>
                ))}
              </select>
            </label>

            <label className="mb-3 block">
              <span className="mb-1 block text-xs font-black text-paw-cocoa/70">Service</span>
              <select
                value={service}
                onChange={(event) => setService(event.target.value)}
                className="h-11 w-full rounded-xl border border-paw-cocoa/10 bg-white/80 px-3 text-sm font-bold outline-none"
              >
                {services.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="mb-4 block">
              <span className="mb-1 block text-xs font-black text-paw-cocoa/70">Minimum rating</span>
              <select
                value={minRating}
                onChange={(event) => setMinRating(event.target.value)}
                className="h-11 w-full rounded-xl border border-paw-cocoa/10 bg-white/80 px-3 text-sm font-bold outline-none"
              >
                <option value="0">Any rating</option>
                <option value="4">4.0+</option>
                <option value="4.5">4.5+</option>
                <option value="4.8">4.8+</option>
              </select>
            </label>

            <button
              type="button"
              onClick={clearFilters}
              className="h-10 w-full rounded-xl bg-white/75 text-sm font-extrabold text-paw-cocoa"
            >
              Clear filters
            </button>
          </section>
        ) : null}

        {status ? <p className="mb-3 text-xs font-extrabold text-paw-pink">{status}</p> : null}
        <div className="space-y-3">
          {visibleVets.map((vet) => (
            <VetCard key={vet.id} vet={vet} />
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            setQuery("Animal Medical Centre");
            setOpenOnly(false);
          }}
          className="mt-5 w-full overflow-hidden rounded-3xl bg-gradient-to-br from-paw-lavender to-paw-pink p-5 text-left text-white shadow-soft"
        >
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-black">Emergency?</h2>
              <p className="text-sm font-bold">Find 24/7 Pet Hospitals in Malaysia</p>
            </div>
            <div className="grid h-24 w-24 place-items-center rounded-full bg-white/30">
              <PawPrint className="fill-white/30" size={54} />
            </div>
          </div>
        </button>
      </div>
      <BottomNav />
    </section>
  );
}
