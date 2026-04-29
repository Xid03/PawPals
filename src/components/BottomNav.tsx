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
    <nav className="fixed bottom-0 left-1/2 z-50 h-[70px] w-full max-w-[430px] -translate-x-1/2 rounded-t-[24px] border border-paw-cocoa/10 bg-[#FFF8ED]/95 px-[14px] pb-[7px] pt-[8px] shadow-[0_-10px_24px_rgba(122,81,63,0.12)] backdrop-blur-xl md:bottom-6 md:rounded-[24px]">
      <div className="grid h-full grid-cols-5 items-center gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active =
            pathname === tab.href ||
            (tab.href !== "/home" && pathname.startsWith(tab.href));

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex h-full flex-col items-center justify-center gap-[2px] text-[10px] font-black leading-none transition ${
                active ? "text-paw-pink" : "text-paw-ink/85"
              }`}
              aria-label={tab.label}
            >
              <span
                className={
                  tab.center
                    ? "grid h-[52px] w-[52px] -translate-y-[7px] place-items-center rounded-full bg-paw-pink text-white shadow-[0_8px_18px_rgba(247,101,137,0.38)] ring-[5px] ring-[#FFF8ED]"
                    : "grid h-[27px] w-[27px] place-items-center rounded-full"
                }
              >
                <Icon
                  size={tab.center ? 28 : 21}
                  strokeWidth={tab.center ? 2.6 : 2.3}
                  className={
                    tab.center
                      ? "fill-white/20"
                      : active && tab.href === "/home"
                        ? "fill-paw-pink"
                        : ""
                  }
                />
              </span>
              {tab.center ? null : <span>{tab.label}</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
