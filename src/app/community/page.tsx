import { Suspense } from "react";
import { CommunityFeedClient } from "@/components/CommunityFeedClient";

export default function CommunityFeedPage() {
  return (
    <Suspense>
      <CommunityFeedClient />
    </Suspense>
  );
}
