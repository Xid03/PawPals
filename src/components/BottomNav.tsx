"use client";

import Link from "next/link";
import { Home, MessageCircle, PawPrint, Search, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Discover", href: "/discover", icon: Search },
  { label: "Create", href: "/create", icon: PawPrint, center: true },
  { label: "Chats", href: "/chats", icon: MessageCircle },
  { label: "Profile", href: "/profile", icon: UserRound }
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 h-[76px] w-full max-w-[430px] -translate-x-1/2 border-t border-paw-cocoa/10 bg-white/80 px-4 pb-3 pt-2 shadow-[0_-12px_30px_rgba(122,81,63,0.08)] backdrop-blur-xl md:bottom-6 md:rounded-b-[2rem]">
      <div className="grid h-full grid-cols-5 items-end gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active =
            pathname === tab.href ||
            (tab.href !== "/home" && pathname.startsWith(tab.href));

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-end gap-1 text-[10px] font-extrabold transition ${
                active ? "text-paw-pink" : "text-paw-ink"
              }`}
            >
              <span
                className={
                  tab.center
                    ? "grid h-14 w-14 -translate-y-2 place-items-center rounded-full bg-paw-pink text-white shadow-soft ring-4 ring-white"
                    : "grid h-8 w-8 place-items-center rounded-full"
                }
              >
                <Icon size={tab.center ? 28 : 20} />
              </span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
