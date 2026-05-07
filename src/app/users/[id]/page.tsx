import { PublicProfileClient } from "@/components/PublicProfileClient";

export default function PublicUserPage({ params }: { params: { id: string } }) {
  return <PublicProfileClient id={params.id} />;
}
