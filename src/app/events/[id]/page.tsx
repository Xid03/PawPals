import { EventDetailClient } from "@/components/EventDetailClient";

export default function EventDetailPage({ params }: { params: { id: string } }) {
  return <EventDetailClient id={params.id} />;
}
