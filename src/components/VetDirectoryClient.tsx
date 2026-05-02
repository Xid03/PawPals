"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Filter, MapPin, PawPrint, Search, Sparkles, X } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { VetCard, type DisplayVet } from "@/components/VetCard";
import { apiFetch, type ApiVet } from "@/lib/api-client";

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
    image: vet.imageUrl ?? "",
    distance,
    rating: vet.rating.toFixed(1),
    reviews: vet._count?.favorites ?? 0,
    status: vet.isOpen ? "Open" : "Closed",
    closes: vet.openHours ?? "Hours unavailable",
    phone: (vet as ApiVet & { phone?: string }).phone
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
  const visibleVets = (hasLoaded ? apiVets.map(mapVet) : []).filter((vet) => !openOnly || vet.status === "Open");
  const activeFilterCount = [openOnly, city !== "All", service !== "All", minRating !== "0"].filter(Boolean).length;

  function clearFilters() {
    setOpenOnly(false);
    setCity("All");
    setService("All");
    setMinRating("0");
  }

  return (
    <section className="min-h-screen bg-[#fff0ec] px-3 pb-24 pt-4">
      <div className="mx-auto max-w-[430px] rounded-[28px] bg-[#fffaf7]/72 px-4 pb-5 pt-5 shadow-[0_14px_42px_rgba(137,91,77,0.06)]">
        <header className="mb-5 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/home"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-[#6b3f35] shadow-[0_10px_22px_rgba(122,81,63,0.06)]"
              aria-label="Go back"
            >
              <ArrowLeft size={25} strokeWidth={2.4} />
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-[26px] font-black leading-none text-[#2f272a]">Vet Directory</h1>
              <p className="mt-2 flex min-w-0 items-center gap-1.5 text-sm font-black text-[#9a837d]">
                <MapPin size={17} className="shrink-0 text-[#f76589]" />
                <span className="truncate">{subtitle.replace(" - ", " • ")}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-[#6b3f35] shadow-[0_10px_22px_rgba(122,81,63,0.06)]"
            aria-label="Clear search"
          >
            <Search size={25} strokeWidth={2.3} />
          </button>
        </header>

        <label className="mb-4 flex h-14 items-center gap-3 rounded-[20px] bg-white px-4 shadow-[0_10px_26px_rgba(122,81,63,0.055)]">
          <Search size={22} className="shrink-0 text-[#7a5148]" />
          <input
            placeholder="Search vets or clinics..."
            className="min-w-0 flex-1 bg-transparent text-sm font-black text-[#2f272a] outline-none placeholder:text-[#a89a95]"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowFilters((current) => !current)}
            className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-full shadow-soft ${
              activeFilterCount ? "bg-[#f76589] text-white" : "bg-[#ffe5ea] text-[#f76589]"
            }`}
            aria-label="Open vet filters"
          >
            <Filter size={21} />
            {activeFilterCount ? (
              <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-paw-lavender text-[10px] font-black text-white">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
        </label>

        {showFilters ? (
          <section className="mb-4 rounded-[22px] border border-paw-peach/50 bg-white/84 p-4 shadow-[0_12px_28px_rgba(122,81,63,0.07)]">
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
          {visibleVets.length ? visibleVets.map((vet) => (
            <VetCard key={vet.id} vet={vet} />
          )) : (
            <div className="rounded-[24px] bg-white p-6 text-center shadow-[0_12px_30px_rgba(137,91,77,0.065)]">
              <PawPrint className="mx-auto h-12 w-12 fill-paw-pink/20 text-paw-pink" />
              <h2 className="mt-3 text-lg font-black text-[#2f272a]">No clinics yet</h2>
              <p className="mt-2 text-sm font-bold text-[#9a837d]">Clinics you add manually will appear here.</p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setQuery("Animal Medical Centre");
            setOpenOnly(false);
          }}
          className="relative mt-4 w-full overflow-hidden rounded-[20px] bg-gradient-to-br from-[#9b78df] via-[#df64a1] to-[#ff637b] px-4 py-3 text-left text-white shadow-[0_10px_22px_rgba(247,101,137,0.14)]"
        >
          <div className="relative z-10 max-w-[165px]">
            <span className="mb-1.5 inline-flex h-6 items-center gap-1.5 rounded-full bg-white/20 pr-2.5 text-[9px] font-black uppercase tracking-wide text-white backdrop-blur-sm">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-paw-pink">
                <Bell size={11} fill="currentColor" />
              </span>
              Urgent Care
            </span>
            <h2 className="text-[21px] font-black leading-none drop-shadow">Emergency?</h2>
            <p className="mt-1 text-xs font-black leading-snug drop-shadow">Find 24/7 Pet Hospitals in Malaysia</p>
            <span className="mt-2.5 inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3.5 text-xs font-black text-paw-pink shadow-soft">
              <MapPin size={14} fill="currentColor" />
              Find Hospitals
              <ArrowLeft className="rotate-180" size={16} />
            </span>
          </div>
          <div className="absolute right-3 top-1/2 grid h-[70px] w-[70px] -translate-y-1/2 place-items-center rounded-full border border-white/35 bg-white/20 shadow-[0_0_0_9px_rgba(255,255,255,0.08)]">
            <PawPrint className="h-10 w-10 fill-white text-white" />
          </div>
          <Sparkles className="absolute right-20 top-7 h-3 w-3 fill-white/80 text-white/80" />
          <Sparkles className="absolute bottom-10 right-28 h-2.5 w-2.5 fill-white/45 text-white/45" />
          <div className="absolute -bottom-10 right-0 h-24 w-44 rounded-[50%] border border-white/10" />
        </button>
      </div>
      <BottomNav />
    </section>
  );
}
