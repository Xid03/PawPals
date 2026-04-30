"use client";

import { useRouter } from "next/navigation";
import { PawPrint } from "lucide-react";
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
      className="mx-auto inline-flex min-h-0 h-[38px] w-[232px] items-center justify-center gap-2 rounded-[18px] px-5 py-3 text-[13px] font-extrabold text-paw-cocoa transition hover:bg-white/60"
    >
      <span>Continue as Guest</span>
      <PawPrint size={15} />
    </button>
  );
}
