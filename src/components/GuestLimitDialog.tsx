"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PawPrint, X } from "lucide-react";
import { listenForGuestLimitDialog } from "@/lib/api-client";
import loginIcon from "../../images/loginIcon.png";

export function GuestLimitDialog() {
  const router = useRouter();
  const [message, setMessage] = useState("");

  useEffect(() => {
    return listenForGuestLimitDialog(setMessage);
  }, []);

  if (!message) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-paw-ink/30 px-5 backdrop-blur-sm">
      <div className="w-full max-w-[330px] rounded-[26px] border border-paw-peach/70 bg-[#fffaf2] p-6 text-center shadow-paw">
        <button
          type="button"
          onClick={() => setMessage("")}
          className="ml-auto grid h-9 w-9 place-items-center rounded-full bg-white/75 text-paw-cocoa"
          aria-label="Close login prompt"
        >
          <X size={17} />
        </button>
        <div className="mx-auto mb-4 grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-paw-blush">
          <img src={loginIcon.src} alt="" className="h-full w-full object-cover" />
        </div>
        <h2 className="text-2xl font-black text-paw-ink">Login Required</h2>
        <p className="mt-2 text-sm font-extrabold leading-relaxed text-paw-cocoa/75">
          {message}
        </p>
        <button
          type="button"
          onClick={() => {
            setMessage("");
            router.push("/auth?mode=login");
          }}
          className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-paw-pink text-sm font-extrabold text-white shadow-soft"
        >
          Go to Login
          <PawPrint size={18} />
        </button>
        <button
          type="button"
          onClick={() => {
            setMessage("");
            router.push("/auth?mode=signup");
          }}
          className="mt-3 h-11 w-full rounded-xl bg-white/75 text-sm font-extrabold text-paw-cocoa"
        >
          Create Account
        </button>
      </div>
    </div>
  );
}
