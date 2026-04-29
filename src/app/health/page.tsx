import Link from "next/link";
import { ChevronRight, Lightbulb, PawPrint, Search, Sparkles } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { PrimaryButton } from "@/components/PrimaryButton";
import { TagChip } from "@/components/TagChip";
import { healthTipCategories } from "@/data/mockData";
import homepageImage from "../../../images/homepage.png";
import tipIcon from "../../../images/tipIcon.png";

export default function HealthTipsPage() {
  return (
    <section className="min-h-screen bg-paw-radial px-5 pb-28 pt-6">
      <div className="mb-8 flex items-center justify-between px-1">
        <span className="text-xl font-black text-paw-ink">9:41</span>
        <div className="flex items-center gap-1 text-paw-ink">
          <span className="h-3 w-1.5 rounded-sm bg-paw-ink" />
          <span className="h-4 w-1.5 rounded-sm bg-paw-ink" />
          <span className="h-5 w-1.5 rounded-sm bg-paw-ink" />
          <span className="ml-1 h-3 w-6 rounded-sm border-2 border-paw-ink bg-paw-ink" />
        </div>
      </div>

      <header className="relative mb-7 flex items-center justify-center gap-5">
        <PawPrint className="fill-paw-rose/30 text-paw-rose" size={27} />
        <h1 className="text-[34px] font-black leading-none text-paw-ink">
          Health Tips
        </h1>
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
        />
      </label>

      <div className="hide-scrollbar mb-8 flex gap-4 overflow-x-auto">
        {["All", "Nutrition", "Grooming", "Behavior", "Wellness"].map((filter, index) => (
          <TagChip key={filter} active={index === 0} className="h-[46px] min-w-[62px] text-[15px]">
            {filter}
          </TagChip>
        ))}
      </div>

      <h2 className="mb-3 flex items-center gap-2 text-[21px] font-black">
        Daily Tip <Sparkles className="text-[#F7B744]" size={20} />
      </h2>

      <section className="relative mb-5 overflow-hidden rounded-[20px] border border-[#F7B744]/40 bg-[#FFF1CB] p-5 shadow-soft">
        <div className="relative z-10 max-w-[58%]">
          <h3 className="text-xl font-black">Keep your cat hydrated!</h3>
          <p className="mt-3 text-base font-extrabold leading-snug text-paw-cocoa">
            Fresh water helps support healthy kidneys and digestion.
          </p>
          <PrimaryButton href="/community" className="mt-5 min-h-0 h-11 w-32 rounded-xl bg-gradient-to-r from-[#FFB23F] to-[#FF9D43] text-sm">
            Learn More
          </PrimaryButton>
        </div>
        <img
          src={homepageImage.src}
          alt=""
          className="absolute bottom-3 right-3 h-36 w-36 object-cover"
        />
        <Sparkles className="absolute right-6 top-7 text-paw-butter" size={24} />
      </section>

      <div className="mb-5 flex justify-center gap-3">
        <span className="h-2.5 w-2.5 rounded-full bg-paw-pink" />
        <span className="h-2.5 w-2.5 rounded-full bg-paw-blush" />
        <span className="h-2.5 w-2.5 rounded-full bg-paw-blush" />
      </div>

      <h2 className="mb-3 text-[21px] font-black">Explore Tips</h2>
      <section className="paw-card overflow-hidden rounded-[20px]">
        {healthTipCategories.map((tip, index) => {
          const Icon = tip.icon;
          return (
            <Link
              key={tip.title}
              href="/community"
              className={`flex items-center gap-4 p-4 ${
                index !== healthTipCategories.length - 1
                  ? "border-b border-paw-cocoa/10"
                  : ""
              }`}
            >
              <span className={`grid h-[58px] w-[58px] shrink-0 place-items-center rounded-2xl ${tip.color}`}>
                <Icon size={28} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-black leading-tight text-paw-ink">
                  {tip.title}
                </span>
                <span className="mt-1 block text-sm font-extrabold leading-snug text-paw-cocoa/75">
                  {tip.description}
                </span>
              </span>
              <ChevronRight size={25} className="text-paw-cocoa/70" />
            </Link>
          );
        })}
      </section>

      <section className="paw-card mt-8 flex items-center overflow-hidden rounded-[20px] border-paw-lavender/30 bg-paw-lilac/80 p-5">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-black">Need expert advice?</h2>
          <p className="mb-3 text-sm font-extrabold text-paw-cocoa/75">
            Find trusted vets near you.
          </p>
          <PrimaryButton href="/vets" variant="lavender" className="min-h-0 h-10 w-28 rounded-xl text-sm">
            Find Vets
          </PrimaryButton>
        </div>
        <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full bg-white/35 text-paw-lavender">
          <Lightbulb size={46} />
        </div>
      </section>

      <BottomNav />
    </section>
  );
}
