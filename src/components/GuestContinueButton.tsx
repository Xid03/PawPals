"use client";

import { useRouter } from "next/navigation";
import { PawPrint, UserRound } from "lucide-react";
import { setGuestMode } from "@/lib/api-client";

export function GuestContinueButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        setGuestMode();
        router.push("/home");
      }}
      className="inline-flex h-[clamp(48px,7vh,56px)] w-full max-w-[286px] items-center justify-center gap-3 rounded-[24px] border-2 border-dashed border-paw-cocoa/20 bg-white/48 px-4 text-[clamp(16px,4.7vw,18px)] font-black text-paw-cocoa shadow-[0_10px_24px_rgba(122,81,63,0.06)] transition hover:bg-white/70"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#fff0d7] text-paw-cocoa/75">
        <UserRound size={20} />
      </span>
      <span>Continue as Guest</span>
      <PawPrint className="h-5 w-5 shrink-0 text-paw-cocoa/60" />
    </button>
  );
}
