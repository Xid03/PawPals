"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, PawPrint, Search, Sparkles } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { PrimaryButton } from "@/components/PrimaryButton";
import { TagChip } from "@/components/TagChip";
import { apiFetch, type ApiHealthTip } from "@/lib/api-client";
import { healthTipCategories } from "@/data/mockData";
import catDoctorImage from "../../images/catDoctor.png";
import homepageImage from "../../images/homepage.png";
import tipIcon from "../../images/tipIcon.png";

export function HealthTipsClient() {
  const [daily, setDaily] = useState<ApiHealthTip | null>(null);
  const [tips, setTips] = useState<ApiHealthTip[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [status, setStatus] = useState("");

  useEffect(() => {
    apiFetch<{ tip: ApiHealthTip | null }>("/api/health-tips/daily")
      .then((data) => setDaily(data.tip))
      .catch(() => undefined);
    apiFetch<ApiHealthTip[]>("/api/health-tips?limit=10")
      .then((items) => setTips(items))
      .catch(() => undefined);
  }, []);

  async function saveTip(id?: string, title?: string) {
    if (!id) {
      setStatus(`${title ?? "Tip"} opened`);
      return;
    }
    try {
      await apiFetch(`/api/health-tips/${id}/save`, { method: "POST" });
      setStatus("Health tip saved");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save tip");
    }
  }

  const dailyTitle = daily?.title ?? "Keep your cat hydrated!";
  const dailyBody = daily?.body ?? "Fresh water helps support healthy kidneys and digestion.";
  const displayedTips = useMemo(() => {
    const source = tips.length ? tips : healthTipCategories;
    const normalized = query.trim().toLowerCase();
    return source.filter((tip) => {
      const isApiTip = "body" in tip;
      const title = tip.title;
      const description = isApiTip ? tip.body : tip.description;
      const category = isApiTip ? tip.category : tip.title;
      const matchesSearch =
        !normalized ||
        [title, description, category].some((value) => value.toLowerCase().includes(normalized));
      const matchesFilter = filter === "All" || category.toLowerCase().includes(filter.toLowerCase());
      return matchesSearch && matchesFilter;
    });
  }, [filter, query, tips]);

  return (
    <section className="min-h-screen bg-paw-radial px-5 pb-28 pt-6">
      <div className="mb-8 flex items-center justify-between px-1">
        <span className="text-xl font-black text-paw-ink">9:41</span>
      </div>
      <header className="relative mb-7 flex items-center justify-center gap-5">
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
      {status ? <p className="mb-3 text-xs font-extrabold text-paw-pink">{status}</p> : null}
      <h2 className="mb-3 flex items-center gap-2 text-[21px] font-black">Daily Tip <Sparkles className="text-[#F7B744]" size={20} /></h2>
      <section className="relative mb-5 overflow-hidden rounded-[20px] border border-[#F7B744]/40 bg-[#FFF1CB] p-5 shadow-soft">
        <div className="relative z-10 max-w-[58%]">
          <h3 className="text-xl font-black">{dailyTitle}</h3>
          <p className="mt-3 text-base font-extrabold leading-snug text-paw-cocoa">{dailyBody}</p>
          <PrimaryButton href="/community" className="mt-5 min-h-0 h-11 w-32 rounded-xl bg-gradient-to-r from-[#FFB23F] to-[#FF9D43] text-sm">
            Learn More
          </PrimaryButton>
        </div>
        <img src={homepageImage.src} alt="" className="absolute bottom-3 right-3 h-36 w-36 object-cover" />
      </section>
      <div className="mb-5 flex justify-center gap-3">
        <span className="h-2.5 w-2.5 rounded-full bg-paw-pink" />
        <span className="h-2.5 w-2.5 rounded-full bg-paw-blush" />
        <span className="h-2.5 w-2.5 rounded-full bg-paw-blush" />
      </div>
      <h2 className="mb-3 text-[21px] font-black">Explore Tips</h2>
      <section className="paw-card overflow-hidden rounded-[20px]">
        {displayedTips.map((tip, index) => {
          const isApiTip = "body" in tip;
          const title = isApiTip ? tip.title : tip.title;
          const description = isApiTip ? tip.body : tip.description;
          const icon = isApiTip ? healthTipCategories[index % healthTipCategories.length].icon : tip.icon;
          const color = isApiTip ? healthTipCategories[index % healthTipCategories.length].color : tip.color;
          const id = isApiTip ? tip.id : undefined;
          return (
            <button
              key={title}
              type="button"
              onClick={() => saveTip(id, title)}
              className={`flex w-full items-center gap-4 p-4 text-left ${index !== displayedTips.length - 1 ? "border-b border-paw-cocoa/10" : ""}`}
            >
              <span className={`grid h-[58px] w-[58px] shrink-0 place-items-center overflow-hidden rounded-2xl ${color}`}>
                <img src={icon} alt="" className="h-full w-full object-cover object-center" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-black leading-tight text-paw-ink">{title}</span>
                <span className="mt-1 block text-sm font-extrabold leading-snug text-paw-cocoa/75">{description}</span>
              </span>
              <ChevronRight size={25} className="text-paw-cocoa/70" />
            </button>
          );
        })}
      </section>
      <section className="paw-card mt-8 flex items-center overflow-hidden rounded-[20px] border-paw-lavender/30 bg-paw-lilac/80 p-5">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-black">Need expert advice?</h2>
          <p className="mb-3 text-sm font-extrabold text-paw-cocoa/75">Find trusted vets near you.</p>
          <PrimaryButton href="/vets" variant="lavender" className="min-h-0 h-10 w-28 rounded-xl text-sm">Find Vets</PrimaryButton>
        </div>
        <div className="h-28 w-28 shrink-0 overflow-hidden rounded-full bg-white/35">
          <img src={catDoctorImage.src} alt="" className="h-full w-full object-cover object-center" />
        </div>
      </section>
      <BottomNav />
    </section>
  );
}
