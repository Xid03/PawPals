"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bookmark, CalendarDays, MapPin, PawPrint, Search } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { PrimaryButton } from "@/components/PrimaryButton";
import { TagChip } from "@/components/TagChip";
import { apiFetch, type ApiEvent } from "@/lib/api-client";
import { events as mockEvents } from "@/data/mockData";
import catEventImage from "../../images/catEvent.png";
import eventIcon from "../../images/eventIcon.png";

function mapEvent(event: ApiEvent) {
  return {
    id: event.id,
    title: event.title,
    date: new Date(event.startsAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
    place: event.location,
    distance: event.city ?? "Nearby",
    image: event.imageUrl ?? mockEvents[0].image
  };
}

export function EventsClient() {
  const [events, setEvents] = useState(mockEvents);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [status, setStatus] = useState("");

  useEffect(() => {
    apiFetch<ApiEvent[]>("/api/events?limit=20")
      .then((items) => {
        if (items.length) setEvents(items.map(mapEvent));
      })
      .catch(() => undefined);
  }, []);

  async function rsvp(eventId: string) {
    try {
      await apiFetch(`/api/events/${eventId}/rsvp`, { method: "POST" });
      setStatus("RSVP saved");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not RSVP");
    }
  }

  async function createEvent() {
    try {
      await apiFetch("/api/events", {
        method: "POST",
        body: JSON.stringify({
          title: "Community Cat Meetup",
          description: "Created from the PawPals UI.",
          category: "MEETUPS",
          startsAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          location: "PawPals Community Center",
          city: "New York"
        })
      });
      setStatus("Event created");
      const items = await apiFetch<ApiEvent[]>("/api/events?limit=20");
      if (items.length) setEvents(items.map(mapEvent));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not create event");
    }
  }

  const visibleEvents = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return events.filter((event) => {
      const matchesSearch =
        !normalized ||
        [event.title, event.place, event.distance].some((value) => value.toLowerCase().includes(normalized));
      const matchesFilter =
        filter === "All" ||
        event.title.toLowerCase().includes(filter.toLowerCase()) ||
        event.place.toLowerCase().includes(filter.toLowerCase());
      return matchesSearch && matchesFilter;
    });
  }, [events, filter, query]);

  return (
    <section className="min-h-screen bg-paw-radial px-5 pb-28 pt-6">
      <div className="mb-8 flex items-center justify-between px-1">
        <span className="text-xl font-black text-paw-ink">9:41</span>
      </div>
      <header className="relative mb-7 flex items-center justify-center gap-5">
        <PawPrint className="fill-paw-rose/30 text-paw-rose" size={27} />
        <h1 className="text-[34px] font-black leading-none text-paw-ink">Events</h1>
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
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <div className="hide-scrollbar mb-8 flex gap-4 overflow-x-auto">
        {["All", "Nearby", "Workshops", "Meetups", "Adoption"].map((item) => (
          <button key={item} type="button" onClick={() => setFilter(item)}>
            <TagChip active={filter === item} className="h-[46px] min-w-[62px] text-[15px]">
              {item}
            </TagChip>
          </button>
        ))}
      </div>
      {status ? <p className="mb-3 text-xs font-extrabold text-paw-pink">{status}</p> : null}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[21px] font-black">
          <PawPrint className="fill-paw-rose/25 text-paw-rose" size={22} />
          Upcoming Events
        </h2>
        <Link href="/events" className="text-base font-black text-paw-pink">See all</Link>
      </div>
      <div className="space-y-4">
        {visibleEvents.map((event) => (
          <article key={event.id} className="paw-card flex gap-4 rounded-[20px] p-3">
            <img src={event.image} alt={event.title} className="h-[104px] w-[104px] shrink-0 rounded-[12px] object-cover" />
            <div className="min-w-0 flex-1 py-1">
              <div className="flex items-start gap-3">
                <h3 className="flex-1 text-[18px] font-black leading-tight text-paw-ink">{event.title}</h3>
                <button type="button" onClick={() => rsvp(event.id)} aria-label="RSVP">
                  <Bookmark className="shrink-0 fill-paw-pink text-paw-pink" size={21} />
                </button>
              </div>
              <p className="mt-3 flex items-center gap-2 text-[13px] font-extrabold text-paw-cocoa/75"><CalendarDays size={15} /> {event.date}</p>
              <p className="mt-2 flex items-center gap-2 text-[13px] font-extrabold text-paw-cocoa/75"><MapPin size={15} /> {event.place}</p>
              <p className="mt-2 flex items-center gap-2 text-[13px] font-extrabold text-paw-cocoa/75"><MapPin size={15} /> {event.distance}</p>
            </div>
          </article>
        ))}
      </div>
      <section className="paw-card mt-7 flex items-center gap-4 overflow-hidden rounded-[20px] border-paw-peach/80 bg-paw-blush/70 p-4">
        <img src={catEventImage.src} alt="" className="h-[88px] w-[112px] shrink-0 object-cover object-center" />
        <div className="min-w-0 flex-1">
          <h2 className="text-[18px] font-black leading-tight">Have an event to share?</h2>
          <p className="mb-3 text-[14px] font-extrabold leading-tight text-paw-cocoa/75">Let the PawPals community know!</p>
          <button type="button" onClick={createEvent} className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-paw-pink text-sm font-extrabold text-white shadow-soft">
            Create Event
          </button>
        </div>
      </section>
      <BottomNav />
    </section>
  );
}
