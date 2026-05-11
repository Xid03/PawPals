"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bookmark, ChevronRight, MapPin, PawPrint, Search, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { StatusToast } from "@/components/StatusToast";
import { TagChip } from "@/components/TagChip";
import { apiFetch, requireSignedIn, type ApiHealthTip } from "@/lib/api-client";
import behaviourIcon from "../../images/behaviourIcon.png";
import catDoctorImage from "../../images/catDoctor.png";
import groomingIcon from "../../images/groomingIcon.png";
import healthyIcon from "../../images/healthyIcon.png";
import homepageImage from "../../images/homepage.png";
import tipIcon from "../../images/tipIcon.png";
import vetIcon from "../../images/vetIcon.png";

type HealthTipView = {
  id?: string;
  title: string;
  description: string;
  body: string;
  category: string;
  icon: string;
  color: string;
};

const healthTipCategories = [
  { title: "Nutrition", icon: healthyIcon.src, color: "bg-[#DFF4C7]" },
  { title: "Grooming", icon: groomingIcon.src, color: "bg-paw-lilac" },
  { title: "Behavior", icon: behaviourIcon.src, color: "bg-paw-blush" },
  { title: "Preventive Care", icon: vetIcon.src, color: "bg-[#DDECFF]" }
];

export function HealthTipsClient() {
  const router = useRouter();
  const [daily, setDaily] = useState<ApiHealthTip | null>(null);
  const [tips, setTips] = useState<ApiHealthTip[]>([]);
  const [dailyIndex, setDailyIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedTip, setSelectedTip] = useState<HealthTipView | null>(null);
  const [status, setStatus] = useState("");
  const [isFindingVets, setIsFindingVets] = useState(false);
  const [isLoadingTips, setIsLoadingTips] = useState(true);

  useEffect(() => {
    apiFetch<{ tip: ApiHealthTip | null }>("/api/health-tips/daily")
      .then((data) => setDaily(data.tip))
      .catch(() => undefined);
    apiFetch<ApiHealthTip[]>("/api/health-tips?limit=10")
      .then((items) => setTips(items))
      .catch(() => undefined)
      .finally(() => setIsLoadingTips(false));
  }, []);

  function mapApiTip(tip: ApiHealthTip, index: number): HealthTipView {
    return {
      id: tip.id,
      title: tip.title,
      description: tip.body,
      body: tip.body,
      category: tip.category,
      icon: healthTipCategories[index % healthTipCategories.length].icon,
      color: healthTipCategories[index % healthTipCategories.length].color
    };
  }

  async function saveTip(id?: string, title?: string) {
    try {
      requireSignedIn();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Please log in to save health tips.");
      return;
    }

    if (!id) {
      setStatus(`${title ?? "Tip"} is ready to read`);
      return;
    }
    try {
      await apiFetch(`/api/health-tips/${id}/save`, { method: "POST" });
      setStatus("Health tip saved");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save tip");
    }
  }

  const dailyTipViews = useMemo<HealthTipView[]>(() => {
    const apiDailyTips = [
      ...(daily ? [daily] : []),
      ...tips.filter((tip) => tip.id !== daily?.id)
    ].slice(0, 3);

    return apiDailyTips.map(mapApiTip);
  }, [daily, tips]);

  useEffect(() => {
    if (dailyIndex > dailyTipViews.length - 1) {
      setDailyIndex(0);
    }
  }, [dailyIndex, dailyTipViews.length]);

  useEffect(() => {
    if (dailyTipViews.length <= 1) return;

    const timer = window.setInterval(() => {
      setDailyIndex((current) => (current + 1) % dailyTipViews.length);
    }, 3500);

    return () => window.clearInterval(timer);
  }, [dailyTipViews.length]);

  const activeDailyTip = dailyTipViews[dailyIndex] ?? null;

  const displayedTips = useMemo<HealthTipView[]>(() => {
    const normalized = query.trim().toLowerCase();
    return tips.map(mapApiTip).filter((tip) => {
      const matchesSearch =
        !normalized ||
        [tip.title, tip.description, tip.category].some((value) => value.toLowerCase().includes(normalized));
      const matchesFilter = filter === "All" || tip.category.toLowerCase().includes(filter.toLowerCase());
      return matchesSearch && matchesFilter;
    });
  }, [filter, query, tips]);

  function findVetsNearby() {
    if (!navigator.geolocation) {
      router.push("/vets");
      return;
    }

    setIsFindingVets(true);
    setStatus("Finding vets near you...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        window.localStorage.setItem(
          "pawpals_location",
          JSON.stringify({ lat: position.coords.latitude, lng: position.coords.longitude })
        );
        router.push("/vets?nearby=true");
      },
      () => {
        setStatus("Location permission was not enabled, showing vet directory");
        setIsFindingVets(false);
        router.push("/vets");
      },
      { enableHighAccuracy: true, maximumAge: 5 * 60 * 1000, timeout: 10000 }
    );
  }

  return (
    <section className="min-h-screen bg-paw-radial px-5 pb-28 pt-6">
      <header className="relative mb-7 flex items-center justify-center gap-5 pt-12">
        <button
          type="button"
          onClick={() => router.back()}
          className="absolute left-0 top-8 grid h-12 w-12 place-items-center rounded-full bg-white/85 text-paw-cocoa shadow-soft transition hover:-translate-x-0.5 hover:bg-white active:scale-95"
          aria-label="Go back"
        >
          <ArrowLeft size={22} />
        </button>
        <PawPrint className="fill-paw-rose/30 text-paw-rose" size={27} />
        <h1 className="text-[34px] font-black leading-none text-paw-ink">Health Tips</h1>
        <PawPrint className="fill-paw-rose/30 text-paw-rose" size={27} />
        <span className="absolute right-6 grid h-14 w-14 place-items-center overflow-hidden rounded-2xl bg-paw-butter shadow-soft">
          <img src={tipIcon.src} alt="" className="h-full w-full object-cover" />
        </span>
      </header>
      <label className="paw-input mb-5 flex h-[66px] items-center gap-4 rounded-[22px] px-5">
        <Search size={25} className="text-paw-cocoa/75" />
        <input
          placeholder="Search health tips..."
          className="w-full bg-transparent text-lg font-bold outline-none placeholder:text-paw-cocoa/55"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <div className="hide-scrollbar mb-8 flex gap-4 overflow-x-auto">
        {["All", "Nutrition", "Grooming", "Behavior", "Wellness"].map((item) => (
          <button key={item} type="button" onClick={() => setFilter(item)}>
            <TagChip active={filter === item} className="h-[46px] min-w-[62px] text-[15px]">
              {item}
            </TagChip>
          </button>
        ))}
      </div>
      <StatusToast message={status} onDismiss={() => setStatus("")} />
      <h2 className="mb-3 flex items-center gap-2 text-[21px] font-black">Daily Tip <Sparkles className="text-[#F7B744]" size={20} /></h2>
      <section className="relative mb-5 overflow-hidden rounded-[20px] border border-[#F7B744]/40 bg-[#FFF1CB] p-5 shadow-soft">
        {activeDailyTip ? (
          <div className="relative z-10 max-w-[58%]">
            <h3 className="text-xl font-black">{activeDailyTip.title}</h3>
            <p className="mt-3 text-base font-extrabold leading-snug text-paw-cocoa">{activeDailyTip.description}</p>
            <button
              type="button"
              onClick={() => setSelectedTip(activeDailyTip)}
              className="mt-5 inline-flex h-11 w-32 items-center justify-center rounded-xl bg-gradient-to-r from-[#FFB23F] to-[#FF9D43] text-sm font-extrabold text-white shadow-soft"
            >
              Learn More
            </button>
          </div>
        ) : (
          <div className="relative z-10 max-w-[70%]">
            <div className="h-6 w-32 animate-pulse rounded-full bg-white/60" />
            <div className="mt-4 h-4 w-full animate-pulse rounded-full bg-white/55" />
            <div className="mt-2 h-4 w-4/5 animate-pulse rounded-full bg-white/45" />
          </div>
        )}
        <img src={homepageImage.src} alt="" className="absolute bottom-3 right-3 h-36 w-36 object-cover" />
      </section>
      <div className="mb-5 flex justify-center gap-3">
        {dailyTipViews.map((tip, index) => (
          <button
            key={`${tip.title}-${index}`}
            type="button"
            onClick={() => setDailyIndex(index)}
            className={`h-2.5 rounded-full transition-all ${dailyIndex === index ? "w-6 bg-paw-pink" : "w-2.5 bg-paw-blush"}`}
            aria-label={`Show daily tip ${index + 1}`}
            aria-pressed={dailyIndex === index}
          />
        ))}
      </div>
      <h2 className="mb-3 text-[21px] font-black">Explore Tips</h2>
      <section className="paw-card overflow-hidden rounded-[20px]">
        {isLoadingTips && !displayedTips.length ? (
          <div className="space-y-3 p-4">
            {[0, 1, 2].map((item) => (
              <div key={item} className="flex items-center gap-4">
                <div className="h-[58px] w-[58px] animate-pulse rounded-2xl bg-paw-blush" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-5 w-40 animate-pulse rounded-full bg-paw-blush" />
                  <div className="h-4 w-full animate-pulse rounded-full bg-paw-blush/70" />
                </div>
              </div>
            ))}
          </div>
        ) : null}
        {displayedTips.map((tip, index) => {
          return (
            <button
              key={tip.title}
              type="button"
              onClick={() => setSelectedTip(tip)}
              className={`flex w-full items-center gap-4 p-4 text-left ${index !== displayedTips.length - 1 ? "border-b border-paw-cocoa/10" : ""}`}
            >
              <span className={`grid h-[58px] w-[58px] shrink-0 place-items-center overflow-hidden rounded-2xl ${tip.color}`}>
                <img src={tip.icon} alt="" className="h-full w-full object-cover object-center" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-black leading-tight text-paw-ink">{tip.title}</span>
                <span className="mt-1 block text-sm font-extrabold leading-snug text-paw-cocoa/75">{tip.description}</span>
              </span>
              <ChevronRight size={25} className="text-paw-cocoa/70" />
            </button>
          );
        })}
        {!isLoadingTips && !displayedTips.length ? (
          <p className="p-5 text-center text-sm font-black text-paw-cocoa">No health tips available yet.</p>
        ) : null}
      </section>
      <section className="paw-card mt-8 flex items-center overflow-hidden rounded-[20px] border-paw-lavender/30 bg-paw-lilac/80 p-5">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-black">Need expert advice?</h2>
          <p className="mb-3 text-sm font-extrabold text-paw-cocoa/75">Find trusted vets near you.</p>
          <button
            type="button"
            onClick={findVetsNearby}
            disabled={isFindingVets}
            className="inline-flex h-10 w-28 items-center justify-center rounded-xl bg-paw-lavender text-sm font-extrabold text-white shadow-soft"
          >
            {isFindingVets ? "Finding..." : "Find Vets"}
          </button>
        </div>
        <div className="h-28 w-28 shrink-0 overflow-hidden rounded-full bg-white/35">
          <img src={catDoctorImage.src} alt="" className="h-full w-full object-cover object-center" />
        </div>
      </section>
      {selectedTip ? (
        <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[430px] rounded-t-[28px] bg-paw-cream p-5 shadow-soft">
          <div className="mb-4 flex items-start gap-4">
            <span className={`grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl ${selectedTip.color}`}>
              <img src={selectedTip.icon} alt="" className="h-full w-full object-cover object-center" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-xs font-black uppercase text-paw-cocoa/60">{selectedTip.category.replaceAll("_", " ")}</p>
              <h3 className="text-xl font-black leading-tight text-paw-ink">{selectedTip.title}</h3>
            </div>
            <button
              type="button"
              onClick={() => setSelectedTip(null)}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/70 text-paw-ink"
              aria-label="Close tip"
            >
              <X size={18} />
            </button>
          </div>
          <p className="text-sm font-extrabold leading-relaxed text-paw-cocoa">{selectedTip.body}</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => saveTip(selectedTip.id, selectedTip.title)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-paw-pink text-sm font-extrabold text-white shadow-soft"
            >
              <Bookmark size={17} />
              Save
            </button>
            <button
              type="button"
              onClick={findVetsNearby}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-paw-lavender text-sm font-extrabold text-white shadow-soft"
            >
              <MapPin size={17} />
              Ask Vet
            </button>
          </div>
        </div>
      ) : null}
      <BottomNav />
    </section>
  );
}
