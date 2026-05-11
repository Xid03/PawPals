import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ImagePlus, MapPin, PawPrint, Plus, Sparkles } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { ageLabel } from "@/lib/api-client";
import { getCurrentUserFromCookie } from "@/server/current-user";
import { prisma } from "@/server/prisma";
import profileIcon from "../../../images/profileIcon.png";

export const dynamic = "force-dynamic";

export default async function MyPawPalsPage() {
  const currentUser = await getCurrentUserFromCookie();
  if (!currentUser) {
    redirect("/login");
  }

  const pawpals = await prisma.catProfile.findMany({
    where: { ownerId: currentUser.id },
    include: {
      photos: { select: { url: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <section className="min-h-screen bg-[#fff6ed] px-5 pb-28 pt-5 text-paw-ink">
      <header className="mb-5 flex items-center gap-3">
        <Link
          href="/profile"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-paw-pink shadow-[0_8px_22px_rgba(247,101,137,0.16)]"
          aria-label="Back to profile"
        >
          <ArrowLeft size={22} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-2 text-[28px] font-black leading-none">
            My PawPals <PawPrint className="h-6 w-6 fill-paw-pink/25 text-paw-pink" />
          </h1>
          <p className="mt-1 text-sm font-bold text-paw-cocoa/70">
            {pawpals.length ? `${pawpals.length} uploaded PawPal profile${pawpals.length === 1 ? "" : "s"}` : "Your uploaded PawPals will appear here."}
          </p>
        </div>
        <Link
          href="/upload-pawpal"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-paw-pink text-white shadow-[0_10px_24px_rgba(247,101,137,0.28)]"
          aria-label="Upload PawPal"
        >
          <Plus size={22} />
        </Link>
      </header>

      {pawpals.length ? (
        <div className="grid gap-4">
          {pawpals.map((pawpal) => {
            const image = pawpal.photos[0]?.url ?? profileIcon.src;
            return (
              <Link
                key={pawpal.id}
                href={`/cats/${pawpal.id}`}
                className="overflow-hidden rounded-[28px] border border-paw-peach/60 bg-white/88 shadow-soft transition hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(122,81,63,0.12)]"
              >
                <div className="relative h-52 bg-paw-blush">
                  <img src={image} alt={pawpal.name} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-paw-ink/72 via-paw-ink/5 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h2 className="text-2xl font-black leading-tight">{pawpal.name}</h2>
                    <p className="mt-1 text-sm font-extrabold">
                      {ageLabel(pawpal.ageMonths)} - {pawpal.breed} - {pawpal.gender}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs font-bold">
                      <MapPin size={14} className="fill-white/20" />
                      {pawpal.city || "Malaysia"}
                    </p>
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  <p className="line-clamp-2 text-sm font-bold leading-relaxed text-paw-cocoa">
                    {pawpal.description || "No description added yet."}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {pawpal.personalityTags.slice(0, 3).map((tag) => (
                      <span key={tag} className="rounded-full bg-[#eee4ff] px-3 py-1 text-xs font-black text-paw-lavender">
                        {tag}
                      </span>
                    ))}
                    {pawpal.lookingFor.slice(0, 2).map((tag) => (
                      <span key={tag} className="rounded-full bg-[#ffe6d1] px-3 py-1 text-xs font-black text-paw-cocoa">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="mt-10 rounded-[30px] border-2 border-dashed border-paw-peach/70 bg-white/70 px-6 py-8 text-center shadow-soft">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-[26px] bg-paw-blush text-paw-pink">
            <ImagePlus size={34} />
          </div>
          <h2 className="mt-5 text-2xl font-black text-paw-ink">No PawPals uploaded yet</h2>
          <p className="mx-auto mt-2 max-w-[260px] text-sm font-bold leading-relaxed text-paw-cocoa/70">
            Create a PawPal profile with photos, age, breed, location, and details.
          </p>
          <Link
            href="/upload-pawpal"
            className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-paw-pink px-6 text-sm font-black text-white shadow-soft"
          >
            Upload PawPal <Sparkles size={17} />
          </Link>
        </div>
      )}

      <BottomNav />
    </section>
  );
}
