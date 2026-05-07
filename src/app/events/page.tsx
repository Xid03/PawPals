import { Suspense } from "react";
import { EventsClient } from "@/components/EventsClient";

export default function EventsPage() {
  return (
    <Suspense>
      <EventsClient />
    </Suspense>
  );
}
