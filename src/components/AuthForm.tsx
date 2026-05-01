"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Apple, Eye, Heart, Lock, Mail, PawPrint, Sparkles, UserRound } from "lucide-react";
import { apiFetch, setToken, type PublicUser } from "@/lib/api-client";
import catLoginImage from "../../images/catLogin.png";
import loginBg from "../../images/loginBg.png";

export function AuthForm({ initialMode }: { initialMode: "login" | "signup" }) {
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const isLogin = mode === "login";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const path = isLogin ? "/api/auth/login" : "/api/auth/register";
      const usernameBase = email.split("@")[0]?.replace(/[^a-zA-Z0-9_]/g, "_") || "pawpal";
      const payload = isLogin
        ? { email, password }
        : {
            name,
            email,
            password,
            username: `${usernameBase}_${Math.floor(Math.random() * 9000 + 1000)}`
          };

      const data = await apiFetch<{ user: PublicUser; token: string }>(path, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      setToken(data.token);
      router.push("/home");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to sign in");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      className="relative min-h-screen overflow-hidden px-7 py-9"
      style={{
        backgroundImage: `linear-gradient(rgba(255,248,239,0.36), rgba(255,248,239,0.24)), url(${loginBg.src})`,
        backgroundPosition: "center",
        backgroundSize: "cover"
      }}
    >
      <PawPrint className="absolute left-16 top-20 h-12 w-12 rotate-[-18deg] fill-paw-pink/10 text-paw-pink/10" />
      <PawPrint className="absolute right-8 top-12 h-11 w-11 rotate-12 fill-paw-pink/10 text-paw-pink/10" />
      <PawPrint className="absolute right-9 top-[210px] h-12 w-12 rotate-[18deg] fill-paw-pink/10 text-paw-pink/10" />
      <Heart className="absolute left-[38%] top-[120px] h-7 w-7 fill-paw-pink/35 text-paw-pink/35" />
      <Sparkles className="absolute right-[38%] top-[150px] h-9 w-9 fill-[#f6c85b] text-[#f6c85b]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[360px] flex-col justify-center">
        <div className="pt-4">
          <h1 className="text-[54px] font-black leading-[1.02] tracking-normal text-paw-ink">
          {isLogin ? (
            <>
              Welcome
              <br />
              <span className="text-paw-pink">Back!</span>{" "}
              <PawPrint size={40} className="inline -translate-y-1 fill-paw-pink/20 text-paw-pink" />
            </>
          ) : (
            <>
              Welcome
              <br />
              <span className="text-paw-pink">PawPal!</span>
            </>
          )}
          </h1>
          <p className="mt-7 text-xl font-extrabold leading-none text-paw-cocoa/85">
            {isLogin ? "Log in to your cozy corner" : "Create your cozy corner"}
          </p>
        </div>

        <div className="relative ml-auto -mt-1 h-[154px] w-[235px]">
          <span className="absolute bottom-3 left-5 h-12 w-44 rounded-[50%] bg-paw-pink/18 blur-[1px]" />
          <img
            src={catLoginImage.src}
            alt=""
            className="relative h-full w-full object-contain object-bottom"
          />
        </div>

        <form className="mt-3 space-y-4" onSubmit={handleSubmit}>
          {!isLogin ? (
            <label className="flex h-[84px] items-center gap-5 rounded-[26px] border border-paw-cocoa/10 bg-white/84 px-6 shadow-soft backdrop-blur">
              <UserRound size={28} className="shrink-0 text-paw-pink" />
              <span className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="text-sm font-black text-paw-cocoa/75">Name</span>
                <input
                  className="w-full bg-transparent text-xl font-bold outline-none placeholder:text-paw-cocoa/45"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required={!isLogin}
                />
              </span>
            </label>
          ) : null}
          <label className="flex h-[84px] items-center gap-5 rounded-[26px] border border-paw-cocoa/10 bg-white/84 px-6 shadow-soft backdrop-blur">
            <Mail size={28} className="shrink-0 text-paw-pink" />
            <span className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="text-sm font-black text-paw-cocoa/75">Email</span>
              <input
                className="w-full bg-transparent text-xl font-bold outline-none placeholder:text-paw-cocoa/45"
                placeholder="Enter your email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </span>
          </label>
          <label className="flex h-[84px] items-center gap-5 rounded-[26px] border border-paw-cocoa/10 bg-white/84 px-6 shadow-soft backdrop-blur">
            <Lock size={28} className="shrink-0 text-paw-pink" />
            <span className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="text-sm font-black text-paw-cocoa/75">Password</span>
              <input
                className="w-full bg-transparent text-xl font-bold outline-none placeholder:text-paw-cocoa/45"
                placeholder="Enter your password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </span>
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-paw-cocoa/70"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <Eye size={26} />
            </button>
          </label>
          <button
            type="submit"
            className="mt-6 inline-flex h-[72px] w-full items-center justify-center gap-3 rounded-[30px] border border-white/70 bg-gradient-to-r from-paw-pink to-paw-rose text-2xl font-black text-white shadow-[0_14px_30px_rgba(247,101,137,0.28)] disabled:opacity-70"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Please wait..." : isLogin ? "Log In" : "Sign Up"}
            <PawPrint size={30} className="fill-white/25" />
          </button>
          {error ? (
            <p className="rounded-xl bg-paw-blush px-3 py-2 text-center text-xs font-extrabold text-paw-pink">
              {error}
            </p>
          ) : null}
        </form>

        <div className="mx-auto my-7 flex w-[230px] items-center gap-5 text-lg font-extrabold text-paw-cocoa/70">
          <span className="h-px flex-1 bg-paw-cocoa/15" />
          <PawPrint size={22} className="fill-paw-cocoa/15 text-paw-cocoa/60" />
          or
          <span className="h-px flex-1 bg-paw-cocoa/15" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            className="flex h-[62px] items-center justify-center gap-3 rounded-[22px] bg-white/84 text-xl font-black text-paw-ink shadow-soft backdrop-blur"
            type="button"
            onClick={() => setError("Google sign-in is not connected yet. Please use email and password.")}
            aria-label="Continue with Google"
          >
            <span className="text-[24px] font-black text-[#4285F4]">G</span>
            Google
          </button>
          <button
            className="flex h-[62px] items-center justify-center gap-3 rounded-[22px] bg-white/84 text-xl font-black text-paw-ink shadow-soft backdrop-blur"
            type="button"
            onClick={() => setError("Apple sign-in is not connected yet. Please use email and password.")}
            aria-label="Continue with Apple"
          >
            <Apple size={25} className="fill-paw-ink" />
            Apple
          </button>
        </div>

        <p className="mt-10 text-center text-xl font-extrabold text-paw-cocoa/75">
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
