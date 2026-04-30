import { VetDetailClient } from "@/components/VetDetailClient";

export const dynamic = "force-dynamic";

export default function VetDetailPage({ params }: { params: { id: string } }) {
  return <VetDetailClient id={params.id} />;
}
