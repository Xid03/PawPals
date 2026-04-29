"use client";

import { useState } from "react";
import Link from "next/link";
import { Apple, Eye, Lock, Mail, PawPrint, UserRound } from "lucide-react";
import { CatMascot } from "@/components/CatMascot";
import { PawPalsLogo } from "@/components/PawPalsLogo";
import { PrimaryButton } from "@/components/PrimaryButton";

export function AuthForm({ initialMode }: { initialMode: "login" | "signup" }) {
  const [mode, setMode] = useState(initialMode);
  const isLogin = mode === "login";

  return (
    <section className="min-h-screen bg-paw-radial px-5 pb-8 pt-10">
      <div className="mb-7 flex items-center justify-between">
        <Link href="/" className="grid h-10 w-10 place-items-center rounded-full bg-white/55">
          <PawPrint size={20} />
        </Link>
        <span className="rounded-full bg-white/55 px-3 py-1.5">
          <PawPalsLogo compact />
        </span>
      </div>

      <div className="mb-5">
        <h1 className="text-3xl font-black leading-tight text-paw-ink">
          {isLogin ? "Welcome Back!" : "Welcome Cat Lover!"}
        </h1>
        <p className="mt-2 text-sm font-bold text-paw-cocoa/75">
          {isLogin ? "Log in to your cozy corner" : "Create your account"}
        </p>
      </div>

      <CatMascot compact />

      <form className="mt-7 space-y-3">
        {!isLogin ? (
          <label className="paw-input flex h-14 items-center gap-3 rounded-2xl px-4">
            <UserRound size={18} className="text-paw-cocoa" />
            <input className="w-full bg-transparent text-sm font-bold outline-none" placeholder="Name" />
          </label>
        ) : null}
        <label className="paw-input flex h-14 items-center gap-3 rounded-2xl px-4">
          <Mail size={18} className="text-paw-cocoa" />
          <input
            className="w-full bg-transparent text-sm font-bold outline-none"
            placeholder="Email"
            type="email"
          />
        </label>
        <label className="paw-input flex h-14 items-center gap-3 rounded-2xl px-4">
          <Lock size={18} className="text-paw-cocoa" />
          <input
            className="w-full bg-transparent text-sm font-bold outline-none"
            placeholder="Password"
            type="password"
          />
          <Eye size={18} className="text-paw-cocoa/70" />
        </label>
        <PrimaryButton href="/home">{isLogin ? "Log In" : "Sign Up"}</PrimaryButton>
      </form>

      <div className="my-7 flex items-center gap-4 text-xs font-bold text-paw-cocoa/70">
        <span className="h-px flex-1 bg-paw-cocoa/15" />
        or
        <span className="h-px flex-1 bg-paw-cocoa/15" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button className="paw-card flex h-14 items-center justify-center gap-2 rounded-2xl text-sm font-black" type="button">
          <span className="text-lg text-[#4285F4]">G</span>
          Google
        </button>
        <button className="paw-card flex h-14 items-center justify-center gap-2 rounded-2xl text-sm font-black" type="button">
          <Apple size={18} className="fill-paw-ink" />
          Apple
        </button>
      </div>

      <p className="mt-10 text-center text-sm font-bold text-paw-cocoa/75">
        {isLogin ? "New to PawPals?" : "Already have an account?"}{" "}
        <button
          className="font-black text-paw-pink"
          type="button"
          onClick={() => setMode(isLogin ? "signup" : "login")}
        >
          {isLogin ? "Sign Up" : "Log In"}
        </button>
      </p>
    </section>
  );
}
