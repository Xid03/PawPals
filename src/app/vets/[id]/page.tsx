import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Globe, Heart, MapPin, Phone, Star } from "lucide-react";
import { PrimaryButton } from "@/components/PrimaryButton";
import { vets } from "@/data/mockData";

export function generateStaticParams() {
  return vets.map((vet) => ({ id: vet.id }));
}

export default function VetDetailPage({ params }: { params: { id: string } }) {
  const vet = vets.find((item) => item.id === params.id);

  if (!vet) {
    notFound();
  }

  return (
    <section className="min-h-screen bg-paw-cream pb-7">
      <div className="relative h-56 overflow-hidden rounded-b-[2rem]">
        <img src={vet.image} alt={vet.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-paw-ink/40 to-transparent" />
        <Link
          href="/vets"
          className="absolute left-5 top-6 grid h-10 w-10 place-items-center rounded-full bg-white/75 text-paw-ink"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </Link>
        <button className="absolute right-5 top-6 grid h-10 w-10 place-items-center rounded-full bg-white/75 text-paw-ink" type="button">
          <Heart size={19} />
        </button>
      </div>
      <div className="px-5 pt-5">
        <h1 className="text-xl font-black">{vet.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-extrabold text-paw-cocoa">
          <span className="flex items-center gap-1">
            <MapPin size={14} /> {vet.distance}
          </span>
          <span>-</span>
          <span className="text-emerald-600">{vet.status}</span>
          <span>{vet.closes}</span>
        </div>
        <p className="mt-2 flex items-center gap-1 text-sm font-black text-paw-cocoa">
          <Star size={16} className="fill-[#FFB23F] text-[#FFB23F]" />
          {vet.rating} ({vet.reviews} reviews)
        </p>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            { label: "Call", icon: Phone },
            { label: "Directions", icon: MapPin },
            { label: "Website", icon: Globe }
          ].map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                className="inline-flex h-11 items-center justify-center gap-1 rounded-2xl bg-paw-lavender px-3 text-xs font-extrabold text-white shadow-soft"
              >
                <Icon size={15} />
                {action.label}
              </button>
            );
          })}
        </div>

        <section className="mt-6">
          <h2 className="mb-2 text-sm font-black">About</h2>
          <p className="text-sm font-bold leading-relaxed text-paw-cocoa">{vet.about}</p>
        </section>

        <section className="mt-6">
          <h2 className="mb-3 text-sm font-black">Services</h2>
          <div className="grid grid-cols-4 gap-3">
            {vet.services.slice(0, 4).map((service) => {
              const Icon = service.icon;
              return (
                <div key={service.label} className="rounded-2xl bg-paw-lilac p-3 text-center text-paw-lavender">
                  <Icon className="mx-auto mb-2" size={24} />
                  <p className="text-[11px] font-extrabold text-paw-cocoa">{service.label}</p>
                </div>
              );
            })}
          </div>
        </section>

        <PrimaryButton href="/chats" variant="lavender" className="mt-7">
          Book Appointment
        </PrimaryButton>
      </div>
    </section>
  );
}
