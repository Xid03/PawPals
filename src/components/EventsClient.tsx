"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Bookmark, Building2, CalendarDays, CheckCircle2, ChevronDown, ChevronRight, ClipboardList, Edit3, Filter, ImagePlus, MapPin, PawPrint, Search, Send, Tag, X } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { StatusToast } from "@/components/StatusToast";
import { apiFetch, requireSignedIn, type ApiEvent } from "@/lib/api-client";
import catEventImage from "../../images/eventCat.png";
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
type NearbyCoordinates = { lat: number; lng: number };

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

function filterCategory(filter: EventFilter) {
  switch (filter) {
    case "Workshops":
      return "WORKSHOPS";
    case "Meetups":
      return "MEETUPS";
    case "Adoption":
      return "ADOPTION";
    default:
      return null;
  }
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
    image: event.imageUrl ?? catEventImage.src,
    category: displayCategory(event.category),
    distanceKm: event.distanceKm ?? null
  };
}

export function EventsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSavedMode = searchParams.get("mode") === "saved";
  const [events, setEvents] = useState<DisplayEvent[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<EventFilter>("All");
  const [cityFilter, setCityFilter] = useState("");
  const [status, setStatus] = useState("");
  const [savedEventIds, setSavedEventIds] = useState<Set<string>>(() => new Set());
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isLocatingNearby, setIsLocatingNearby] = useState(false);
  const [hasNearbyLocation, setHasNearbyLocation] = useState(false);
  const [nearbyCoordinates, setNearbyCoordinates] = useState<NearbyCoordinates | null>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [eventForm, setEventForm] = useState<EventForm>(() => initialEventForm());
  const [eventImage, setEventImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
  const [showEventSuccess, setShowEventSuccess] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  function eventsPath(params?: Record<string, string>) {
    const nextParams = new URLSearchParams({
      limit: "20",
      ...(isSavedMode ? { mode: "saved" } : {}),
      ...params
    });
    return `/api/events?${nextParams.toString()}`;
  }

  function eventQueryParams(overrides?: Record<string, string>) {
    const params: Record<string, string> = {};
    const trimmedQuery = query.trim();
    const category = filterCategory(filter);

    if (trimmedQuery) params.q = trimmedQuery;
    if (category) params.category = category;
    if (cityFilter.trim()) params.city = cityFilter.trim();
    if (filter === "Nearby" && nearbyCoordinates) {
      params.lat = String(nearbyCoordinates.lat);
      params.lng = String(nearbyCoordinates.lng);
    }

    return { ...params, ...overrides };
  }

  function setEventItems(items: ApiEvent[]) {
    setEvents(items.map(mapEvent));
    setSavedEventIds(new Set(items.filter((event) => event.savedByMe).map((event) => event.id)));
  }

  useEffect(() => {
    if (filter === "Nearby" && !nearbyCoordinates) return;

    const timer = window.setTimeout(() => {
      setIsLoadingEvents(true);
      apiFetch<ApiEvent[]>(eventsPath(eventQueryParams()))
        .then(setEventItems)
        .catch((error) => setStatus(error instanceof Error ? error.message : "Could not load events"))
        .finally(() => setIsLoadingEvents(false));
    }, query.trim() ? 250 : 0);

    return () => window.clearTimeout(timer);
  }, [cityFilter, filter, isSavedMode, nearbyCoordinates, query]);

  async function saveEvent(eventId: string) {
    setStatus("");
    try {
      requireSignedIn();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Please log in to save events.");
      return;
    }

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
      if (isSavedMode && !nextSaved) {
        setEvents((current) => current.filter((event) => event.id !== eventId));
      }
    } catch {
      setStatus(nextSaved ? "Event saved on this device" : "Event removed from saved");
    }
  }

  function showAllEvents() {
    setFilter("All");
    setQuery("");
    setCityFilter("");
    setStatus("");
    setHasNearbyLocation(false);
    setNearbyCoordinates(null);
    if (isSavedMode) {
      router.push("/events");
      return;
    }
  }

  function selectFilter(nextFilter: EventFilter) {
    if (nextFilter === "Nearby") {
      findNearbyEvents();
      return;
    }

    setFilter(nextFilter);
    setHasNearbyLocation(false);
    setNearbyCoordinates(null);
    setStatus("");
  }

  function clearFilters() {
    setFilter("All");
    setCityFilter("");
    setHasNearbyLocation(false);
    setNearbyCoordinates(null);
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
        setNearbyCoordinates({ lat: latitude, lng: longitude });
        setHasNearbyLocation(true);
        setStatus("Showing events nearest to you");
        setIsLocatingNearby(false);
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
    const items = await apiFetch<ApiEvent[]>(eventsPath(eventQueryParams()));
    setEventItems(items);
  }

  async function createEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setIsSubmittingEvent(true);
    try {
      requireSignedIn();
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

  const visibleEvents = useMemo(() => events, [events]);

  return (
    <section className="min-h-screen bg-[#fff8f2] px-3 pb-24 pt-3">
      <div className="mx-auto max-w-[430px] rounded-[28px] bg-[#fff2ee]/84 px-4 pb-5 pt-6 shadow-[0_14px_42px_rgba(137,91,77,0.075)]">
        <header className="relative mb-5 flex items-center justify-center gap-3 pt-5">
          <button
            type="button"
            onClick={() => router.back()}
            className="absolute left-0 top-0 z-10 grid h-12 w-12 place-items-center rounded-full bg-white/85 text-[#8a6760] shadow-[0_10px_24px_rgba(137,91,77,0.09)] transition hover:-translate-x-0.5 hover:bg-white active:scale-95"
            aria-label="Go back"
          >
            <ArrowLeft size={22} />
          </button>
          <PawPrint className="absolute left-10 top-1 h-16 w-16 rotate-[-8deg] fill-paw-rose/10 text-paw-rose/10" />
          <PawPrint className="h-7 w-7 fill-paw-pink/45 text-paw-pink" />
          <h1 className="text-[34px] font-black leading-none text-[#2f292d] drop-shadow-sm">{isSavedMode ? "Saved Events" : "Events"}</h1>
          <PawPrint className="h-7 w-7 fill-paw-pink/45 text-paw-pink" />
          <span className="absolute right-2 top-0 grid h-14 w-14 place-items-center overflow-hidden rounded-[18px]">
            <img src={eventIcon.src} alt="" className="h-full w-full object-cover" />
          </span>
        </header>

        <label className="mb-4 flex h-14 items-center gap-3 rounded-[20px] bg-white px-4 shadow-[0_10px_24px_rgba(137,91,77,0.055)]">
          <Search size={23} className="shrink-0 text-[#8a6760]" />
          <input
            ref={searchInputRef}
            placeholder={isSavedMode ? "Search saved events..." : "Search events..."}
            className="min-w-0 flex-1 bg-transparent text-sm font-black text-[#2f292d] outline-none placeholder:text-[#a6918c]"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowFilters((current) => !current)}
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full shadow-soft ${
              showFilters || filter !== "All" || cityFilter ? "bg-paw-pink text-white" : "bg-[#ffe7eb] text-paw-pink"
            }`}
            aria-label="Filter events"
            aria-expanded={showFilters}
          >
            <Filter size={22} />
          </button>
        </label>

        {showFilters ? (
          <div className="mb-5 rounded-[22px] bg-white/88 p-3 shadow-[0_10px_24px_rgba(137,91,77,0.055)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-black text-[#2f292d]">Filter Events</p>
              <button type="button" onClick={clearFilters} className="text-xs font-black text-paw-pink">
                Clear
              </button>
            </div>
            <div className="mb-3 grid grid-cols-2 gap-2">
              {(["All", "Workshops", "Meetups", "Adoption"] as EventFilter[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => selectFilter(item)}
                  className={`h-10 rounded-[15px] text-xs font-black transition ${
                    filter === item ? "bg-paw-pink text-white shadow-soft" : "bg-paw-blush/60 text-paw-cocoa"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <label className="mb-3 flex h-11 items-center gap-2 rounded-[15px] border border-paw-peach/70 bg-white px-3">
              <MapPin size={17} className="shrink-0 text-paw-pink" />
              <input
                value={cityFilter}
                onChange={(event) => setCityFilter(event.target.value)}
                placeholder="Filter by city, e.g. Ipoh"
                className="min-w-0 flex-1 bg-transparent text-xs font-black text-[#2f292d] outline-none placeholder:text-[#a6918c]"
              />
            </label>
            <button
              type="button"
              onClick={findNearbyEvents}
              disabled={isLocatingNearby}
              className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-[16px] text-xs font-black shadow-soft ${
                filter === "Nearby" ? "bg-paw-pink text-white" : "bg-paw-blush text-paw-cocoa"
              } disabled:opacity-70`}
            >
              <MapPin size={17} />
              {isLocatingNearby ? "Finding nearby events..." : hasNearbyLocation ? "Showing nearby events" : "Use my location"}
            </button>
          </div>
        ) : null}

        <div className="hide-scrollbar mb-6 flex gap-3 overflow-x-auto">
          {(["All", "Nearby", "Workshops", "Meetups", "Adoption"] as EventFilter[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => selectFilter(item)}
              disabled={item === "Nearby" && isLocatingNearby}
              className={`h-9 shrink-0 rounded-[15px] px-4 text-xs font-black shadow-[0_7px_16px_rgba(137,91,77,0.05)] ${
                filter === item ? "bg-gradient-to-br from-[#b869ee] to-[#8b5be5] text-white" : "bg-white text-[#33272a]"
              }`}
            >
              {item === "Nearby" && isLocatingNearby ? "Locating..." : item}
            </button>
          ))}
        </div>

        <StatusToast message={status} onDismiss={() => setStatus("")} />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-[21px] font-black text-[#2f292d]">
            <PawPrint className="h-6 w-6 fill-paw-pink/45 text-paw-pink" />
            {isSavedMode ? "Your Saved Events" : "Upcoming Events"}
          </h2>
          {filter !== "All" || isSavedMode ? (
            <button type="button" onClick={showAllEvents} className="inline-flex items-center gap-1 text-base font-black text-paw-pink">
              See all
              <ChevronRight size={19} />
            </button>
          ) : null}
        </div>

        <div className="space-y-3">
          {isLoadingEvents ? (
            <div className="grid gap-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className="flex gap-3 rounded-[22px] bg-white p-3 shadow-[0_10px_26px_rgba(137,91,77,0.06)]">
                  <div className="h-[96px] w-[96px] shrink-0 animate-pulse rounded-[16px] bg-paw-blush/70" />
                  <div className="min-w-0 flex-1 space-y-3 py-1">
                    <div className="h-5 w-4/5 animate-pulse rounded-full bg-paw-blush/70" />
                    <div className="h-3 w-2/3 animate-pulse rounded-full bg-paw-blush/60" />
                    <div className="h-3 w-3/4 animate-pulse rounded-full bg-paw-blush/60" />
                    <div className="h-3 w-1/2 animate-pulse rounded-full bg-paw-blush/60" />
                  </div>
                </div>
              ))}
            </div>
          ) : visibleEvents.length ? visibleEvents.map((event) => (
            <article
              key={event.id}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/events/${event.id}`)}
              onKeyDown={(keyboardEvent) => {
                if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
                  keyboardEvent.preventDefault();
                  router.push(`/events/${event.id}`);
                }
              }}
              className="flex cursor-pointer gap-3 rounded-[22px] bg-white p-3 shadow-[0_10px_26px_rgba(137,91,77,0.06)] transition active:scale-[0.99]"
            >
              <img src={event.image} alt={event.title} className="h-[96px] w-[96px] shrink-0 rounded-[16px] object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-3">
                  <h3 className="line-clamp-2 flex-1 text-lg font-black leading-tight text-[#2f292d]">{event.title}</h3>
                  <button
                    type="button"
                    onClick={(clickEvent) => {
                      clickEvent.stopPropagation();
                      saveEvent(event.id);
                    }}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#fff4f5] text-paw-pink"
                    aria-label={savedEventIds.has(event.id) ? "Remove saved event" : "Save event"}
                  >
                    <Bookmark
                      className={`${savedEventIds.has(event.id) ? "fill-paw-pink" : "fill-transparent"}`}
                      size={20}
                      strokeWidth={2.6}
                    />
                  </button>
                </div>
                <p className="mt-2 flex items-center gap-2 text-xs font-black text-[#a18a85]">
                  <CalendarDays size={15} className="shrink-0 text-paw-pink" /> {event.date}
                </p>
                <p className="mt-1.5 flex items-center gap-2 text-xs font-black text-[#a18a85]">
                  <MapPin size={15} className="shrink-0 text-paw-pink" /> <span className="line-clamp-1">{event.place}</span>
                </p>
                <p className="mt-1.5 flex items-center gap-2 text-xs font-black text-[#a18a85]">
                  <MapPin size={15} className="shrink-0 text-paw-pink" /> <span className="line-clamp-1">{event.distance}</span>
                </p>
              </div>
            </article>
          )) : (
            <div className="rounded-[22px] bg-white px-5 py-8 text-center shadow-[0_10px_26px_rgba(137,91,77,0.06)]">
              <PawPrint className="mx-auto h-10 w-10 fill-paw-pink/25 text-paw-pink/45" />
              <p className="mt-3 text-sm font-black text-[#a18a85]">{isSavedMode ? "No saved events yet." : "No events right now."}</p>
            </div>
          )}
        </div>
      </div>

      <section className="mx-auto mt-4 flex max-w-[430px] items-center gap-3 overflow-hidden rounded-[24px] bg-white px-4 py-4 shadow-[0_12px_32px_rgba(137,91,77,0.085)]">
        <div className="relative grid h-24 w-24 shrink-0 place-items-center">
          <div className="absolute inset-1 rounded-full bg-paw-blush/70" />
          <PawPrint className="absolute left-0 top-2 h-4 w-4 rotate-[-18deg] fill-paw-pink/35 text-paw-pink/35" />
          <img src={catEventImage.src} alt="" className="relative z-10 h-20 w-20 object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-black leading-tight text-[#2f292d]">Have an event to share?</h2>
          <p className="mt-1.5 text-sm font-black leading-snug text-[#a18a85]">
            Let the <span className="text-paw-pink">PawPals</span> community know!
          </p>
          <button
            type="button"
            onClick={() => {
              try {
                requireSignedIn();
                setIsCreatingEvent(true);
              } catch (error) {
                setStatus(error instanceof Error ? error.message : "Please log in to create events.");
              }
            }}
            className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-paw-rose to-paw-pink text-sm font-black text-white shadow-[0_10px_22px_rgba(247,101,137,0.22)]"
          >
            <CalendarDays size={20} />
            Create Event
            <ChevronRight size={22} />
          </button>
        </div>
      </section>
      {isCreatingEvent ? (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-hidden bg-paw-ink/25 px-4 py-2 backdrop-blur-sm">
          <form
            onSubmit={createEvent}
            className="mx-auto w-full max-w-[372px] rounded-[22px] bg-[#fffaf5] p-4 shadow-[0_18px_48px_rgba(58,38,38,0.18)]"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-[25px] font-black leading-none text-[#2f292d]">Event Details</h2>
                <p className="mt-1.5 text-xs font-bold leading-snug text-paw-cocoa/78">
                  Fill in the details to share your event with the community.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetEventForm();
                  setIsCreatingEvent(false);
                }}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paw-blush/70 text-paw-cocoa shadow-soft"
                aria-label="Close event form"
              >
                <X size={22} strokeWidth={3} />
              </button>
            </div>

            <label className="mb-2.5 block">
              <span className="mb-1.5 flex items-center gap-2 text-[11px] font-black uppercase text-paw-cocoa">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-paw-blush text-paw-pink">
                  <Edit3 size={14} />
                </span>
                Title
              </span>
              <input
                required
                maxLength={140}
                value={eventForm.title}
                onChange={(event) => updateEventForm("title", event.target.value)}
                className="h-10 w-full rounded-[14px] border border-paw-peach/65 bg-white/66 px-4 text-xs font-black text-[#334155] outline-none transition focus:border-paw-pink/60 focus:shadow-[0_0_0_4px_rgba(247,101,137,0.12)]"
                placeholder="Cat cafe meetup in Ipoh"
              />
            </label>

            <label className="mb-2.5 block">
              <span className="mb-1.5 flex items-center gap-2 text-[11px] font-black uppercase text-paw-cocoa">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-paw-blush text-paw-pink">
                  <ClipboardList size={14} />
                </span>
                Description
              </span>
              <span className="relative block">
                <textarea
                  maxLength={500}
                  value={eventForm.description}
                  onChange={(event) => updateEventForm("description", event.target.value)}
                  className="min-h-[66px] w-full resize-none rounded-[14px] border border-paw-peach/65 bg-white/66 px-4 py-2.5 pr-14 text-xs font-black text-[#334155] outline-none transition focus:border-paw-pink/60 focus:shadow-[0_0_0_4px_rgba(247,101,137,0.12)]"
                  placeholder="Share the plan, supplies, or who should join."
                />
                <span className="pointer-events-none absolute bottom-2.5 right-4 text-[11px] font-bold text-paw-cocoa/70">
                  {eventForm.description.length}/500
                </span>
              </span>
            </label>

            <div className="mb-2.5 grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 flex items-center gap-2 text-[10px] font-black uppercase text-paw-cocoa">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-paw-blush text-paw-pink">
                    <CalendarDays size={13} />
                  </span>
                  Date & Time
                </span>
                <input
                  required
                  type="datetime-local"
                  value={eventForm.startsAt}
                  onChange={(event) => updateEventForm("startsAt", event.target.value)}
                  className="h-10 w-full rounded-[14px] border border-paw-peach/65 bg-white/66 px-2.5 text-[10px] font-black text-[#2f292d] outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 flex items-center gap-2 text-[10px] font-black uppercase text-paw-cocoa">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-paw-blush text-paw-pink">
                    <Tag size={13} />
                  </span>
                  Type
                </span>
                <span className="relative block">
                  <select
                    value={eventForm.category}
                    onChange={(event) => updateEventForm("category", event.target.value as EventCategory)}
                    className="h-10 w-full appearance-none rounded-[14px] border border-paw-peach/65 bg-white/66 px-3 pr-8 text-xs font-black text-[#2f292d] outline-none"
                  >
                    {eventCategories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-paw-cocoa" size={18} />
                </span>
              </label>
            </div>

            <label className="mb-2.5 block">
              <span className="mb-1.5 flex items-center gap-2 text-[11px] font-black uppercase text-paw-cocoa">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-paw-blush text-paw-pink">
                  <MapPin size={14} />
                </span>
                Location
              </span>
              <span className="relative block">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-paw-lavender" size={17} />
                <input
                  required
                  maxLength={160}
                  value={eventForm.location}
                  onChange={(event) => updateEventForm("location", event.target.value)}
                  className="h-10 w-full rounded-[14px] border border-paw-peach/65 bg-white/66 px-10 pr-4 text-[11px] font-black text-[#334155] outline-none"
                  placeholder="PawPals Community Hub, Kuala Lumpur"
                />
              </span>
            </label>

            <label className="mb-2.5 block">
              <span className="mb-1.5 flex items-center gap-2 text-[11px] font-black uppercase text-paw-cocoa">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-paw-blush text-paw-pink">
                  <Building2 size={14} />
                </span>
                City
              </span>
              <span className="relative block">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-paw-lavender" size={17} />
                <input
                  maxLength={80}
                  value={eventForm.city}
                  onChange={(event) => updateEventForm("city", event.target.value)}
                  className="h-10 w-full rounded-[14px] border border-paw-peach/65 bg-white/66 px-10 pr-4 text-[11px] font-black text-[#334155] outline-none"
                  placeholder="Ipoh"
                />
              </span>
            </label>

            <div className="mb-3">
              <p className="mb-1.5 text-[11px] font-black uppercase text-paw-cocoa">
                Event Image <span className="text-paw-pink">(Optional)</span>
              </p>
              <div className="flex items-center gap-3">
                {imagePreview ? (
                  <img src={imagePreview} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                ) : (
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border-2 border-dashed border-paw-rose/50 text-paw-cocoa/70">
                    <ImagePlus size={18} />
                  </div>
                )}
                <label className="flex h-12 min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-paw-peach/55 bg-paw-blush/22 px-3 text-center">
                  <ImagePlus size={17} className="shrink-0 text-paw-cocoa/70" />
                  <span className="min-w-0">
                    <span className="block text-[11px] font-black text-paw-cocoa">Add Event Image</span>
                    <span className="mt-0.5 block text-[9px] font-bold text-paw-cocoa/70">JPG, PNG up to 10MB</span>
                  </span>
                  <input type="file" accept="image/*" onChange={selectEventImage} className="hidden" />
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingEvent}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-paw-rose to-paw-pink text-base font-black text-white shadow-[0_10px_22px_rgba(247,101,137,0.2)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Send size={18} />
              {isSubmittingEvent ? "Creating..." : "Post Event"}
            </button>
          </form>
        </div>
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
