"use client";

import { useState } from "react";
import { Apple, Eye, Lock, Mail, PawPrint, UserRound } from "lucide-react";
import { PrimaryButton } from "@/components/PrimaryButton";
import catOneImage from "../../images/cat1.png";

export function AuthForm({ initialMode }: { initialMode: "login" | "signup" }) {
  const [mode, setMode] = useState(initialMode);
  const isLogin = mode === "login";

  return (
    <section className="relative min-h-screen overflow-hidden bg-paw-radial">
      <PawPrint className="absolute right-[16px] top-[2px] text-paw-peach/80" size={16} />
      <PawPrint className="absolute right-[40px] top-[31px] text-paw-peach/80" size={18} />
      <PawPrint className="absolute right-[12px] top-[88px] text-paw-peach/80" size={17} />
      <PawPrint className="absolute left-[91px] top-[92px] text-paw-rose/70" size={17} />
      <PawPrint className="absolute left-[96px] top-[155px] text-paw-peach/70" size={16} />

      <div className="relative mx-auto min-h-screen w-full max-w-[236px] pb-[44px] pt-[27px]">
        <h1 className="text-[26px] font-black leading-[31px] text-paw-ink">
          {isLogin ? (
            <>
              Welcome
              <br />
              Back!
            </>
          ) : (
            <>
              Welcome
              <br />
              Cat Lover!
            </>
          )}
        </h1>
        <p className="mt-[9px] text-[13px] font-extrabold leading-none text-paw-cocoa/80">
          {isLogin ? "Log in to your cozy corner" : "Create your account"}
        </p>

        <div className="ml-auto -mt-[2px] h-[86px] w-[142px] overflow-hidden">
          <img
            src={catOneImage.src}
            alt=""
            className="h-full w-full object-cover object-center"
          />
        </div>

        <form className="mt-[2px] space-y-[12px]">
          {!isLogin ? (
            <label className="paw-input flex h-[43px] items-center gap-[14px] rounded-[11px] px-[17px]">
              <UserRound size={16} className="text-paw-cocoa/80" />
              <input
                className="w-full bg-transparent text-[12px] font-extrabold outline-none placeholder:text-paw-cocoa/55"
                placeholder="Name"
              />
            </label>
          ) : null}
          <label className="paw-input flex h-[43px] items-center gap-[14px] rounded-[11px] px-[17px]">
            <Mail size={16} className="text-paw-cocoa/80" />
            <input
              className="w-full bg-transparent text-[12px] font-extrabold outline-none placeholder:text-paw-cocoa/55"
              placeholder="Email"
              type="email"
            />
          </label>
          <label className="paw-input flex h-[43px] items-center gap-[14px] rounded-[11px] px-[17px]">
            <Lock size={16} className="text-paw-cocoa/80" />
            <input
              className="w-full bg-transparent text-[12px] font-extrabold outline-none placeholder:text-paw-cocoa/55"
              placeholder="Password"
              type="password"
            />
            <Eye size={16} className="text-paw-cocoa/70" />
          </label>
          <PrimaryButton
            href="/home"
            className="min-h-0 h-[43px] rounded-[18px] text-[14px]"
          >
            {isLogin ? "Log In" : "Sign Up"}
          </PrimaryButton>
        </form>

        <div className="mx-auto my-[25px] flex w-[156px] items-center gap-[15px] text-[12px] font-extrabold text-paw-cocoa/70">
          <span className="h-px flex-1 bg-paw-cocoa/15" />
          or
          <span className="h-px flex-1 bg-paw-cocoa/15" />
        </div>

        <div className="grid grid-cols-2 gap-[9px]">
          <button
            className="paw-card flex h-[40px] items-center justify-center rounded-[18px]"
            type="button"
            aria-label="Continue with Google"
          >
            <span className="text-[18px] font-black text-[#4285F4]">G</span>
          </button>
          <button
            className="paw-card flex h-[40px] items-center justify-center rounded-[18px]"
            type="button"
            aria-label="Continue with Apple"
          >
            <Apple size={18} className="fill-paw-ink" />
          </button>
        </div>

        <p className="mt-[50px] text-center text-[12px] font-extrabold text-paw-cocoa/75">
          {isLogin ? "New to PawPals?" : "Already have an account?"}{" "}
          <button
            className="font-black text-paw-pink"
            type="button"
            onClick={() => setMode(isLogin ? "signup" : "login")}
          >
            {isLogin ? "Sign Up" : "Log In"}
          </button>
        </p>
      </div>
    </section>
  );
}
