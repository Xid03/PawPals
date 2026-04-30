"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Bookmark, CalendarDays, CheckCircle2, ImagePlus, MapPin, PawPrint, Search, X } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { TagChip } from "@/components/TagChip";
import { apiFetch, type ApiEvent } from "@/lib/api-client";
import { events as mockEvents } from "@/data/mockData";
import catEventImage from "../../images/catEvent.png";
import eventIcon from "../../images/eventIcon.png";

type EventCategory = "NEARBY" | "WORKSHOPS" | "MEETUPS" | "ADOPTION";

type EventForm = {
  title: string;
  description: string;
  category: EventCategory;
  startsAt: string;
  location: string;
  city: string;
};

type EventFilter = "All" | "Nearby" | "Workshops" | "Meetups" | "Adoption";

type DisplayEvent = {
  id: string;
  title: string;
  date: string;
  place: string;
  distance: string;
  image: string;
  category: EventFilter;
  distanceKm?: number | null;
};

const eventCategories: { label: string; value: EventCategory }[] = [
  { label: "Nearby", value: "NEARBY" },
  { label: "Workshops", value: "WORKSHOPS" },
  { label: "Meetups", value: "MEETUPS" },
  { label: "Adoption", value: "ADOPTION" }
];

function dateTimeInputValue(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function displayCategory(category?: string | null): EventFilter {
  switch (category) {
    case "NEARBY":
      return "Nearby";
    case "WORKSHOPS":
      return "Workshops";
    case "ADOPTION":
      return "Adoption";
    case "MEETUPS":
    default:
      return "Meetups";
  }
}

function inferMockCategory(event: (typeof mockEvents)[number]): EventFilter {
  const text = `${event.title} ${event.place}`.toLowerCase();
  if (text.includes("adoption")) return "Adoption";
  if (text.includes("workshop")) return "Workshops";
  if (text.includes("park") || text.includes("km")) return "Nearby";
  return "Meetups";
}

function initialEvents(): DisplayEvent[] {
  return mockEvents.map((event) => ({
    ...event,
    category: inferMockCategory(event)
  }));
}

function initialEventForm(): EventForm {
  return {
    title: "",
    description: "",
    category: "MEETUPS",
    startsAt: dateTimeInputValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    location: "",
    city: ""
  };
}

function mapEvent(event: ApiEvent) {
  return {
    id: event.id,
    title: event.title,
    date: new Date(event.startsAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
    place: event.location,
    distance: typeof event.distanceKm === "number" ? `${event.distanceKm} km away` : event.city ?? "Nearby",
    image: event.imageUrl ?? mockEvents[0].image,
    category: displayCategory(event.category),
    distanceKm: event.distanceKm ?? null
  };
}

export function EventsClient() {
  const [events, setEvents] = useState<DisplayEvent[]>(() => initialEvents());
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<EventFilter>("All");
  const [status, setStatus] = useState("");
  const [savedEventIds, setSavedEventIds] = useState<Set<string>>(() => new Set());
  const [isLocatingNearby, setIsLocatingNearby] = useState(false);
  const [hasNearbyLocation, setHasNearbyLocation] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [eventForm, setEventForm] = useState<EventForm>(() => initialEventForm());
  const [eventImage, setEventImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
  const [showEventSuccess, setShowEventSuccess] = useState(false);

  useEffect(() => {
    apiFetch<ApiEvent[]>("/api/events?limit=20")
      .then((items) => {
        if (items.length) setEvents(items.map(mapEvent));
      })
      .catch(() => undefined);
  }, []);

  async function saveEvent(eventId: string) {
    setStatus("");
    let nextSaved = false;
    setSavedEventIds((current) => {
      const next = new Set(current);
      nextSaved = !next.has(eventId);
      if (nextSaved) {
        next.add(eventId);
      } else {
        next.delete(eventId);
      }
      return next;
    });

    try {
      await apiFetch(`/api/events/${eventId}/save`, { method: "POST" });
      setStatus(nextSaved ? "Event saved" : "Event removed from saved");
    } catch {
      setStatus(nextSaved ? "Event saved on this device" : "Event removed from saved");
    }
  }

  function showAllEvents() {
    setFilter("All");
    setQuery("");
    setStatus("");
    setHasNearbyLocation(false);
    void refreshEvents().catch(() => undefined);
  }

  function selectFilter(nextFilter: EventFilter) {
    if (nextFilter === "Nearby") {
      findNearbyEvents();
      return;
    }

    setFilter(nextFilter);
    setHasNearbyLocation(false);
    setStatus("");
  }

  function findNearbyEvents() {
    setFilter("Nearby");
    setStatus("");

    if (!("geolocation" in navigator)) {
      setHasNearbyLocation(false);
      setStatus("Location is not available in this browser.");
      return;
    }

    setIsLocatingNearby(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const params = new URLSearchParams({
            limit: "20",
            lat: String(latitude),
            lng: String(longitude)
          });
          const items = await apiFetch<ApiEvent[]>(`/api/events?${params.toString()}`);
          if (items.length) setEvents(items.map(mapEvent));
          setHasNearbyLocation(true);
          setStatus("Showing events nearest to you");
        } catch (error) {
          setHasNearbyLocation(false);
          setStatus(error instanceof Error ? error.message : "Could not load nearby events");
        } finally {
          setIsLocatingNearby(false);
        }
      },
      () => {
        setHasNearbyLocation(false);
        setIsLocatingNearby(false);
        setStatus("Allow location access to show nearby events.");
      },
      { enableHighAccuracy: true, maximumAge: 5 * 60 * 1000, timeout: 10000 }
    );
  }

  function updateEventForm<K extends keyof EventForm>(key: K, value: EventForm[K]) {
    setEventForm((current) => ({ ...current, [key]: value }));
  }

  function selectEventImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setEventImage(file);
    setImagePreview(file ? URL.createObjectURL(file) : "");
  }

  function resetEventForm() {
    if (imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setEventForm(initialEventForm());
    setEventImage(null);
    setImagePreview("");
  }

  async function refreshEvents() {
    const items = await apiFetch<ApiEvent[]>("/api/events?limit=20");
    if (items.length) setEvents(items.map(mapEvent));
  }

  async function createEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setIsSubmittingEvent(true);
    try {
      let imageUrl: string | undefined;
      const startsAt = new Date(eventForm.startsAt);

      if (Number.isNaN(startsAt.getTime())) {
        setStatus("Please choose a valid event date and time.");
        return;
      }

      if (eventImage) {
        const uploadForm = new FormData();
        uploadForm.append("file", eventImage);
        uploadForm.append("folder", "events");
        const upload = await apiFetch<{ url: string }>("/api/uploads", {
          method: "POST",
          body: uploadForm
        });
        imageUrl = upload.url;
      }

      await apiFetch<{ event: ApiEvent }>("/api/events", {
        method: "POST",
        body: JSON.stringify({
          title: eventForm.title.trim(),
          description: eventForm.description.trim() || undefined,
          category: eventForm.category,
          startsAt: startsAt.toISOString(),
          location: eventForm.location.trim(),
          city: eventForm.city.trim() || undefined,
          imageUrl
        })
      });
      resetEventForm();
      setIsCreatingEvent(false);
      setShowEventSuccess(true);
      await refreshEvents().catch(() => undefined);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not create event");
    } finally {
      setIsSubmittingEvent(false);
    }
  }

  const visibleEvents = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return events.filter((event) => {
      const matchesSearch =
        !normalized ||
        [event.title, event.place, event.distance].some((value) => value.toLowerCase().includes(normalized));
      const matchesFilter =
        filter === "All" || (filter === "Nearby" && hasNearbyLocation) || event.category === filter;
      return matchesSearch && matchesFilter;
    });
  }, [events, filter, hasNearbyLocation, query]);

  return (
    <section className="min-h-screen bg-paw-radial px-5 pb-28 pt-6">
      <header className="relative mb-7 flex items-center justify-center gap-5 pt-12">
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
        {(["All", "Nearby", "Workshops", "Meetups", "Adoption"] as EventFilter[]).map((item) => (
          <button key={item} type="button" onClick={() => selectFilter(item)} disabled={item === "Nearby" && isLocatingNearby}>
            <TagChip active={filter === item} className="h-[46px] min-w-[62px] text-[15px]">
              {item === "Nearby" && isLocatingNearby ? "Locating..." : item}
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
        <button type="button" onClick={showAllEvents} className="text-base font-black text-paw-pink">
          See all
        </button>
      </div>
      <div className="space-y-4">
        {visibleEvents.map((event) => (
          <article key={event.id} className="paw-card flex gap-4 rounded-[20px] p-3">
            <img src={event.image} alt={event.title} className="h-[104px] w-[104px] shrink-0 rounded-[12px] object-cover" />
            <div className="min-w-0 flex-1 py-1">
              <div className="flex items-start gap-3">
                <h3 className="flex-1 text-[18px] font-black leading-tight text-paw-ink">{event.title}</h3>
                <button type="button" onClick={() => saveEvent(event.id)} aria-label={savedEventIds.has(event.id) ? "Remove saved event" : "Save event"}>
                  <Bookmark
                    className={`shrink-0 text-paw-pink ${savedEventIds.has(event.id) ? "fill-paw-pink" : "fill-transparent"}`}
                    size={21}
                  />
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
          <button type="button" onClick={() => setIsCreatingEvent(true)} className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-paw-pink text-sm font-extrabold text-white shadow-soft">
            Create Event
          </button>
        </div>
      </section>
      {isCreatingEvent ? (
        <form onSubmit={createEvent} className="paw-card mt-4 rounded-[20px] p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black text-paw-ink">Event Details</h2>
            <button
              type="button"
              onClick={() => {
                resetEventForm();
                setIsCreatingEvent(false);
              }}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/70 text-paw-cocoa"
              aria-label="Close event form"
            >
              <X size={18} />
            </button>
          </div>

          <label className="mb-3 block">
            <span className="mb-2 block text-xs font-black uppercase text-paw-cocoa/70">Title</span>
            <input
              required
              maxLength={140}
              value={eventForm.title}
              onChange={(event) => updateEventForm("title", event.target.value)}
              className="paw-input h-12 w-full rounded-2xl px-4 text-sm font-bold"
              placeholder="Cat cafe meetup"
            />
          </label>

          <label className="mb-3 block">
            <span className="mb-2 block text-xs font-black uppercase text-paw-cocoa/70">Description</span>
            <textarea
              maxLength={1000}
              value={eventForm.description}
              onChange={(event) => updateEventForm("description", event.target.value)}
              className="paw-input min-h-24 w-full resize-none rounded-2xl px-4 py-3 text-sm font-bold"
              placeholder="Share the plan, supplies, or who should join."
            />
          </label>

          <div className="mb-3 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase text-paw-cocoa/70">Date</span>
              <input
                required
                type="datetime-local"
                value={eventForm.startsAt}
                onChange={(event) => updateEventForm("startsAt", event.target.value)}
                className="paw-input h-12 w-full rounded-2xl px-3 text-xs font-bold"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase text-paw-cocoa/70">Type</span>
              <select
                value={eventForm.category}
                onChange={(event) => updateEventForm("category", event.target.value as EventCategory)}
                className="paw-input h-12 w-full rounded-2xl px-3 text-xs font-bold"
              >
                {eventCategories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="mb-3 block">
            <span className="mb-2 block text-xs font-black uppercase text-paw-cocoa/70">Location</span>
            <input
              required
              maxLength={160}
              value={eventForm.location}
              onChange={(event) => updateEventForm("location", event.target.value)}
              className="paw-input h-12 w-full rounded-2xl px-4 text-sm font-bold"
              placeholder="PawPals Community Center"
            />
          </label>

          <label className="mb-4 block">
            <span className="mb-2 block text-xs font-black uppercase text-paw-cocoa/70">City</span>
            <input
              maxLength={80}
              value={eventForm.city}
              onChange={(event) => updateEventForm("city", event.target.value)}
              className="paw-input h-12 w-full rounded-2xl px-4 text-sm font-bold"
              placeholder="New York"
            />
          </label>

          <div className="mb-5 flex items-center gap-3">
            {imagePreview ? (
              <img src={imagePreview} alt="" className="h-20 w-20 shrink-0 rounded-2xl object-cover" />
            ) : (
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-white/70 text-paw-cocoa">
                <ImagePlus size={26} />
              </div>
            )}
            <label className="inline-flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-white/70 px-4 text-sm font-extrabold text-paw-cocoa">
              <ImagePlus size={18} />
              Add Event Image
              <input type="file" accept="image/*" onChange={selectEventImage} className="hidden" />
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmittingEvent}
            className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-paw-pink text-sm font-extrabold text-white shadow-soft disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmittingEvent ? "Creating..." : "Post Event"}
          </button>
        </form>
      ) : null}
      {showEventSuccess ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-paw-ink/30 px-5 backdrop-blur-sm">
          <div className="w-full max-w-[320px] rounded-[24px] border border-paw-peach/70 bg-[#fffaf2] p-6 text-center shadow-paw">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-paw-mint text-paw-cocoa">
              <CheckCircle2 size={34} />
            </div>
            <h2 className="text-2xl font-black text-paw-ink">Event Posted!</h2>
            <p className="mt-2 text-sm font-extrabold leading-relaxed text-paw-cocoa/75">
              Your event is now shared with the PawPals community.
            </p>
            <button
              type="button"
              onClick={() => setShowEventSuccess(false)}
              className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl bg-paw-pink text-sm font-extrabold text-white shadow-soft"
            >
              Done
            </button>
          </div>
        </div>
      ) : null}
      <BottomNav />
    </section>
  );
}
