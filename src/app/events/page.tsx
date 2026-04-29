import Link from "next/link";
import { Bookmark, CalendarDays, MapPin, PawPrint, Search } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { PrimaryButton } from "@/components/PrimaryButton";
import { TagChip } from "@/components/TagChip";
import { events } from "@/data/mockData";
import catEventImage from "../../../images/catEvent.png";
import eventIcon from "../../../images/eventIcon.png";

export default function EventsPage() {
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
          Events
        </h1>
        <PawPrint className="fill-paw-rose/30 text-paw-rose" size={27} />
        <span className="absolute right-6 grid h-14 w-14 place-items-center overflow-hidden rounded-2xl bg-paw-blush shadow-soft">
          <img src={eventIcon.src} alt="" className="h-full w-full object-cover" />
        </span>
      </header>

      <label className="paw-input mb-5 flex h-[66px] items-center gap-4 rounded-[22px] px-5">
        <Search size={25} className="text-paw-cocoa/75" />
        <input
          placeholder="Search events..."
          className="w-full bg-transparent text-lg font-bold outline-none placeholder:text-paw-cocoa/55"
        />
      </label>

      <div className="hide-scrollbar mb-8 flex gap-4 overflow-x-auto">
        {["All", "Nearby", "Workshops", "Meetups", "Adoption"].map((filter, index) => (
          <TagChip key={filter} active={index === 0} className="h-[46px] min-w-[62px] text-[15px]">
            {filter}
          </TagChip>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[21px] font-black">
          <PawPrint className="fill-paw-rose/25 text-paw-rose" size={22} />
          Upcoming Events
        </h2>
        <Link href="/events" className="text-base font-black text-paw-pink">
          See all
        </Link>
      </div>

      <div className="space-y-4">
        {events.map((event) => (
          <article key={event.id} className="paw-card flex gap-4 rounded-[20px] p-3">
            <img
              src={event.image}
              alt={event.title}
              className="h-[104px] w-[104px] shrink-0 rounded-[12px] object-cover"
            />
            <div className="min-w-0 flex-1 py-1">
              <div className="flex items-start gap-3">
                <h3 className="flex-1 text-[18px] font-black leading-tight text-paw-ink">
                  {event.title}
                </h3>
                <Bookmark className="shrink-0 fill-paw-pink text-paw-pink" size={21} />
              </div>
              <p className="mt-3 flex items-center gap-2 text-[13px] font-extrabold text-paw-cocoa/75">
                <CalendarDays size={15} /> {event.date}
              </p>
              <p className="mt-2 flex items-center gap-2 text-[13px] font-extrabold text-paw-cocoa/75">
                <MapPin size={15} /> {event.place}
              </p>
              <p className="mt-2 flex items-center gap-2 text-[13px] font-extrabold text-paw-cocoa/75">
                <MapPin size={15} /> {event.distance}
              </p>
            </div>
          </article>
        ))}
      </div>

      <section className="paw-card mt-7 flex items-center gap-4 overflow-hidden rounded-[20px] border-paw-peach/80 bg-paw-blush/70 p-4">
        <img
          src={catEventImage.src}
          alt=""
          className="h-[88px] w-[112px] shrink-0 object-cover object-center"
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-[18px] font-black leading-tight">Have an event to share?</h2>
          <p className="mb-3 text-[14px] font-extrabold leading-tight text-paw-cocoa/75">
            Let the PawPals community know!
          </p>
          <PrimaryButton href="/create" className="min-h-0 h-12 w-full rounded-xl text-sm">
            Create Event
          </PrimaryButton>
        </div>
      </section>

      <BottomNav />
    </section>
  );
}
