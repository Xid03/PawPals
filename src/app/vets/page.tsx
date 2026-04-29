import { Filter, PawPrint, Search } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { VetCard } from "@/components/VetCard";
import { vets } from "@/data/mockData";

export default function VetDirectoryPage() {
  return (
    <section className="min-h-screen bg-paw-radial pb-28">
      <PageHeader title="Vet Directory" subtitle="New York, USA" backHref="/home" action="search" />
      <div className="px-5">
        <label className="paw-input mb-4 flex h-14 items-center gap-3 rounded-2xl px-4">
          <Search size={18} className="text-paw-cocoa" />
          <input
            placeholder="Search vets or clinics..."
            className="w-full bg-transparent text-sm font-bold outline-none"
          />
          <Filter size={18} className="text-paw-cocoa" />
        </label>

        <div className="space-y-3">
          {vets.map((vet) => (
            <VetCard key={vet.id} vet={vet} />
          ))}
        </div>

        <section className="mt-5 overflow-hidden rounded-3xl bg-gradient-to-br from-paw-lavender to-paw-pink p-5 text-white shadow-soft">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-black">Emergency?</h2>
              <p className="text-sm font-bold">Find 24/7 Pet Hospitals</p>
            </div>
            <div className="grid h-24 w-24 place-items-center rounded-full bg-white/30">
              <PawPrint className="fill-white/30" size={54} />
            </div>
          </div>
        </section>
      </div>
      <BottomNav />
    </section>
  );
}
