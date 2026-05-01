"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Heart, PawPrint, Sparkles, UserRound, X } from "lucide-react";
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
      <div className="relative w-full max-w-[360px] overflow-hidden rounded-[36px] border-2 border-paw-peach/70 bg-[#fff8ee] px-7 pb-8 pt-6 text-center shadow-[0_24px_70px_rgba(58,34,26,0.28)]">
        <div className="pointer-events-none absolute -left-14 -top-12 h-36 w-52 rounded-[46%] bg-paw-blush/60" />
        <div className="pointer-events-none absolute -bottom-16 -left-12 h-32 w-48 rounded-[48%] bg-paw-blush/55" />
        <div className="pointer-events-none absolute -bottom-16 -right-12 h-32 w-48 rounded-[48%] bg-paw-blush/55" />
        <PawPrint className="pointer-events-none absolute left-8 top-24 h-12 w-12 rotate-[-12deg] fill-paw-peach/20 text-paw-peach/20" />
        <PawPrint className="pointer-events-none absolute right-8 top-44 h-12 w-12 rotate-12 fill-paw-peach/20 text-paw-peach/20" />
        <button
          type="button"
          onClick={() => setMessage("")}
          className="relative ml-auto grid h-14 w-14 place-items-center rounded-full border border-paw-peach/45 bg-white/80 text-paw-cocoa shadow-[0_8px_20px_rgba(122,81,63,0.1)]"
          aria-label="Close login prompt"
        >
          <X size={30} strokeWidth={3} />
        </button>

        <div className="relative mx-auto mb-5 mt-1 grid h-32 w-32 place-items-center rounded-full bg-paw-blush shadow-[0_18px_35px_rgba(247,101,137,0.22)]">
          <Sparkles className="absolute -left-9 top-10 h-6 w-6 fill-paw-butter text-paw-butter" />
          <Sparkles className="absolute -right-8 top-16 h-5 w-5 fill-white text-white" />
          <span className="relative grid h-[92px] w-[92px] place-items-center overflow-hidden rounded-full bg-white/75 shadow-[0_10px_18px_rgba(247,101,137,0.2)] ring-4 ring-white/80">
            <img src={loginIcon.src} alt="" className="h-full w-full object-cover" />
          </span>
        </div>

        <h2 className="text-[34px] font-black leading-tight text-paw-cocoa">
          Login <span className="text-paw-pink">Required</span>
        </h2>
        <p className="mx-auto mt-3 max-w-[280px] text-[18px] font-black leading-relaxed text-paw-cocoa/75">
          {message}
        </p>
        <div className="mx-auto mt-4 flex w-16 items-center justify-center gap-2 text-paw-blush">
          <span className="h-1.5 w-1.5 rounded-full bg-paw-blush" />
          <Heart className="h-5 w-5 fill-paw-blush text-paw-blush" />
          <span className="h-1.5 w-1.5 rounded-full bg-paw-blush" />
        </div>
        <button
          type="button"
          onClick={() => {
            setMessage("");
            router.push("/auth?mode=login");
          }}
          className="mt-4 inline-flex h-[68px] w-full items-center justify-center gap-4 rounded-[30px] border border-paw-pink bg-gradient-to-r from-paw-pink to-paw-rose text-[26px] font-black text-white shadow-[0_16px_32px_rgba(247,101,137,0.35)]"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-paw-pink">
            <PawPrint className="h-7 w-7 fill-paw-pink/35" />
          </span>
          Go to Login
          <PawPrint className="h-8 w-8 fill-white/20" />
        </button>
        <button
          type="button"
          onClick={() => {
            setMessage("");
            router.push("/auth?mode=signup");
          }}
          className="mt-4 inline-flex h-[60px] w-full items-center justify-center gap-4 rounded-[28px] border-2 border-paw-cocoa/10 bg-white/75 text-[21px] font-black text-paw-cocoa shadow-[0_10px_24px_rgba(122,81,63,0.08)]"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-paw-blush text-paw-pink">
            <UserRound size={24} />
          </span>
          Create Account
          <ChevronRight className="h-8 w-8 text-paw-pink" />
        </button>
      </div>
    </div>
  );
}
