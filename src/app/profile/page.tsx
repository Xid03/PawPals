import { ChevronRight, Edit3 } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { currentUser, profileMenu } from "@/data/mockData";

export default function UserProfilePage() {
  return (
    <section className="min-h-screen bg-paw-radial pb-28">
      <div className="relative mb-16 h-44 overflow-visible bg-paw-lavender">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle,#fff_2px,transparent_2px)] [background-size:34px_34px]" />
        <button className="absolute right-5 top-6 grid h-10 w-10 place-items-center rounded-full bg-white/35 text-white" type="button">
          <Edit3 size={18} />
        </button>
        <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 text-center">
          <img
            src={currentUser.catAvatar}
            alt="Whiskers"
            className="mx-auto h-28 w-28 rounded-full border-4 border-paw-cream object-cover shadow-soft"
          />
          <h1 className="mt-2 text-xl font-black">{currentUser.name}</h1>
          <p className="text-xs font-bold text-paw-cocoa/70">{currentUser.role}</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 px-8 text-center">
        <div>
          <p className="text-lg font-black">{currentUser.stats.posts}</p>
          <p className="text-xs font-bold text-paw-cocoa/70">Posts</p>
        </div>
        <div>
          <p className="text-lg font-black">{currentUser.stats.followers}</p>
          <p className="text-xs font-bold text-paw-cocoa/70">Followers</p>
        </div>
        <div>
          <p className="text-lg font-black">{currentUser.stats.following}</p>
          <p className="text-xs font-bold text-paw-cocoa/70">Following</p>
        </div>
      </div>

      <div className="px-5">
        <section className="paw-card overflow-hidden rounded-3xl">
          {profileMenu.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className={`flex h-16 w-full items-center gap-4 px-5 text-left ${
                  index !== profileMenu.length - 1 ? "border-b border-paw-cocoa/10" : ""
                }`}
                type="button"
              >
                <Icon size={19} className="text-paw-cocoa" />
                <span className="flex-1 text-sm font-extrabold">{item.label}</span>
                <ChevronRight size={18} className="text-paw-cocoa/55" />
              </button>
            );
          })}
        </section>
      </div>
      <BottomNav />
    </section>
  );
}
