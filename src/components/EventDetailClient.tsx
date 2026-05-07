"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bookmark, CalendarDays, MapPin, Tag, UserRound } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { StatusToast } from "@/components/StatusToast";
import { apiFetch, requireSignedIn, type ApiEvent, type PublicUser } from "@/lib/api-client";
import catEventImage from "../../images/eventCat.png";

type EventDetail = ApiEvent & {
  organizer?: PublicUser;
};

function categoryLabel(category?: string | null) {
  switch (category) {
    case "NEARBY":
      return "Nearby";
    case "WORKSHOPS":
      return "Workshop";
    case "ADOPTION":
      return "Adoption";
    case "MEETUPS":
    default:
      return "Meetup";
  }
}

function eventDate(value: string) {
  return new Date(value).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

export function EventDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEvent(null);
    setStatus("");
    setIsLoading(true);
    apiFetch<{ event: EventDetail }>(`/api/events/${id}`)
      .then((data) => setEvent(data.event))
      .catch((error) => setStatus(error instanceof Error ? error.message : "Could not load event"))
      .finally(() => setIsLoading(false));
  }, [id]);

  async function toggleSave() {
    if (!event || isSaving) return;
    setStatus("");
    try {
      requireSignedIn();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Please log in to save events.");
      return;
    }

    const nextSaved = !event.savedByMe;
    setEvent({ ...event, savedByMe: nextSaved });
    setIsSaving(true);
    try {
      await apiFetch(`/api/events/${event.id}/save`, { method: "POST" });
      setStatus(nextSaved ? "Event saved" : "Event removed from saved");
    } catch (error) {
      setEvent({ ...event, savedByMe: !nextSaved });
      setStatus(error instanceof Error ? error.message : "Could not update saved event");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="min-h-screen bg-[#fff8f2] px-3 pb-24 pt-3">
      <div className="mx-auto max-w-[430px] overflow-hidden rounded-[28px] bg-[#fff2ee]/84 shadow-[0_14px_42px_rgba(137,91,77,0.075)]">
        <div className="relative h-64 bg-white">
          {event ? (
            <img src={event.imageUrl ?? catEventImage.src} alt={event.title} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full animate-pulse bg-gradient-to-br from-paw-blush via-white to-paw-peach/60" />
          )}
          <button
            type="button"
            onClick={() => router.back()}
            className="absolute left-5 top-5 inline-flex h-12 min-w-[104px] items-center justify-center gap-2 rounded-full border-2 border-paw-pink bg-white px-4 text-sm font-black text-paw-pink shadow-[0_10px_24px_rgba(58,38,38,0.22)]"
            aria-label="Back to events"
          >
            <ArrowLeft size={22} strokeWidth={3.2} />
            Back
          </button>
          {event ? (
            <button
              type="button"
              onClick={toggleSave}
              disabled={isSaving}
              className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/92 text-paw-pink shadow-soft disabled:opacity-70"
              aria-label={event.savedByMe ? "Remove saved event" : "Save event"}
            >
              <Bookmark size={22} strokeWidth={2.7} className={event.savedByMe ? "fill-paw-pink" : "fill-transparent"} />
            </button>
          ) : null}
        </div>

        <div className="px-5 pb-6 pt-5">
          <StatusToast message={status} onDismiss={() => setStatus("")} />
          {isLoading ? (
            <div className="grid gap-4">
              <div className="h-8 w-28 animate-pulse rounded-full bg-white shadow-soft" />
              <div className="h-9 w-4/5 animate-pulse rounded-2xl bg-white shadow-soft" />
              <div className="grid gap-3">
                <div className="h-12 animate-pulse rounded-[18px] bg-white shadow-[0_8px_20px_rgba(137,91,77,0.055)]" />
                <div className="h-16 animate-pulse rounded-[18px] bg-white shadow-[0_8px_20px_rgba(137,91,77,0.055)]" />
                <div className="h-12 animate-pulse rounded-[18px] bg-white shadow-[0_8px_20px_rgba(137,91,77,0.055)]" />
              </div>
              <div className="h-32 animate-pulse rounded-[22px] bg-white shadow-[0_10px_26px_rgba(137,91,77,0.06)]" />
            </div>
          ) : null}

          {!isLoading && event ? (
            <>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-black text-paw-pink shadow-soft">
                <Tag size={15} />
                {categoryLabel(event.category)}
              </div>
              <h1 className="text-[30px] font-black leading-tight text-[#2f292d]">{event.title}</h1>

              <div className="mt-4 grid gap-3">
                <p className="flex items-center gap-3 rounded-[18px] bg-white px-4 py-3 text-sm font-black text-[#8a6760] shadow-[0_8px_20px_rgba(137,91,77,0.055)]">
                  <CalendarDays size={19} className="shrink-0 text-paw-pink" />
                  {eventDate(event.startsAt)}
                </p>
                <p className="flex items-start gap-3 rounded-[18px] bg-white px-4 py-3 text-sm font-black text-[#8a6760] shadow-[0_8px_20px_rgba(137,91,77,0.055)]">
                  <MapPin size={19} className="mt-0.5 shrink-0 text-paw-pink" />
                  <span>
                    <span className="block text-[#2f292d]">{event.location}</span>
                    {event.city ? <span className="mt-1 block text-xs text-[#a18a85]">{event.city}</span> : null}
                  </span>
                </p>
                {event.organizer ? (
                  <p className="flex items-center gap-3 rounded-[18px] bg-white px-4 py-3 text-sm font-black text-[#8a6760] shadow-[0_8px_20px_rgba(137,91,77,0.055)]">
                    <UserRound size={19} className="shrink-0 text-paw-pink" />
                    Hosted by {event.organizer.name}
                  </p>
                ) : null}
              </div>

              <section className="mt-5 rounded-[22px] bg-white px-5 py-5 shadow-[0_10px_26px_rgba(137,91,77,0.06)]">
                <h2 className="text-lg font-black text-[#2f292d]">Details</h2>
                <p className="mt-3 whitespace-pre-line text-sm font-bold leading-relaxed text-[#8a6760]">
                  {event.description || "No extra details have been added for this event yet."}
                </p>
              </section>
            </>
          ) : null}
        </div>
      </div>
      <BottomNav />
    </section>
  );
}
