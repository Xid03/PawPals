import { CatProfileClient } from "@/components/CatProfileClient";

export const dynamic = "force-dynamic";

export default function CatProfilePage({ params }: { params: { id: string } }) {
  return <CatProfileClient id={params.id} />;
}
