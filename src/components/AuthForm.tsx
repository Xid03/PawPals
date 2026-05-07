"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Camera, Eye, Heart, Lock, Mail, MapPin, PawPrint, Sparkles, UserRound } from "lucide-react";
import { apiFetch, setToken, type PublicUser } from "@/lib/api-client";
import catLoginImage from "../../images/catLogin.png";
import loginBg from "../../images/loginBg.png";
import profileIconImage from "../../images/profileIcon.png";

export function AuthForm({ initialMode }: { initialMode: "login" | "signup" }) {
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [setupError, setSetupError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [profileUsername, setProfileUsername] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [profileAvatarFile, setProfileAvatarFile] = useState<File | null>(null);
  const [profileAvatarPreview, setProfileAvatarPreview] = useState("");
  const [successTitle, setSuccessTitle] = useState("");
  const [successMessage, setSuccessMessage] = useState("Welcome back to your cozy PawPals corner.");
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const isLogin = mode === "login";

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
      if (profileAvatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(profileAvatarPreview);
      }
    };
  }, [profileAvatarPreview]);

  function continueToHome() {
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
    }
    router.push("/home");
  }

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
      if (isLogin) {
        setSuccessMessage("Welcome back to your cozy PawPals corner.");
        setSuccessTitle("Login Successful");
        redirectTimerRef.current = setTimeout(() => {
          router.push("/home");
        }, 1400);
        return;
      }

      setProfileUsername(data.user.username);
      setNeedsProfileSetup(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to sign in");
    } finally {
      setIsSubmitting(false);
    }
  }

  function selectProfileAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (profileAvatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(profileAvatarPreview);
    }
    setProfileAvatarFile(file);
    setProfileAvatarPreview(file ? URL.createObjectURL(file) : "");
  }

  async function handleProfileSetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSetupError("");
    setIsSavingProfile(true);

    try {
      await apiFetch<{ user: PublicUser }>("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          username: profileUsername.trim(),
          bio: bio.trim(),
          city: city.trim()
        })
      });

      if (profileAvatarFile) {
        const avatarForm = new FormData();
        avatarForm.append("file", profileAvatarFile);
        await apiFetch<{ user: PublicUser; avatarUrl: string }>("/api/users/me/avatar", {
          method: "POST",
          body: avatarForm
        });
      }

      setSuccessMessage("Your PawPals profile is ready.");
      setSuccessTitle("Profile Completed");
      redirectTimerRef.current = setTimeout(() => {
        router.push("/home");
      }, 1400);
    } catch (caught) {
      setSetupError(caught instanceof Error ? caught.message : "Unable to save your profile");
    } finally {
      setIsSavingProfile(false);
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
        {needsProfileSetup ? (
          <div className="pt-4">
            <h1 className="text-[48px] font-black leading-[1.04] tracking-normal text-paw-ink">
              Set Up
              <br />
              <span className="text-paw-pink">Profile</span>{" "}
              <PawPrint size={36} className="inline -translate-y-1 fill-paw-pink/20 text-paw-pink" />
            </h1>
            <p className="mt-5 text-lg font-extrabold leading-snug text-paw-cocoa/85">
              Tell PawPals who you are before entering.
            </p>
          </div>
        ) : (
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
        )}

        <div className={`relative ml-auto -mt-1 h-[154px] w-[235px] ${needsProfileSetup ? "hidden" : ""}`}>
          <span className="absolute bottom-3 left-5 h-12 w-44 rounded-[50%] bg-paw-pink/18 blur-[1px]" />
          <img
            src={catLoginImage.src}
            alt=""
            className="relative h-full w-full object-contain object-bottom"
          />
        </div>

        {needsProfileSetup ? (
          <form className="mt-7 space-y-4" onSubmit={handleProfileSetup}>
            <label className="flex min-h-[112px] cursor-pointer items-center gap-5 rounded-[26px] border border-paw-cocoa/10 bg-white/84 px-6 py-4 shadow-soft backdrop-blur">
              <span className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-paw-blush text-paw-pink ring-4 ring-white/70">
                <img
                  src={profileAvatarPreview || profileIconImage.src}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <span className="absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full bg-paw-pink text-white ring-2 ring-white">
                  <Camera size={16} />
                </span>
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="text-sm font-black text-paw-cocoa/75">Profile Picture</span>
                <span className="text-lg font-bold leading-tight text-paw-ink">
                  {profileAvatarFile ? profileAvatarFile.name : "Choose a photo"}
                </span>
                <span className="text-xs font-extrabold text-paw-cocoa/55">JPG or PNG works best</span>
              </span>
              <input type="file" accept="image/*" onChange={selectProfileAvatar} className="hidden" />
            </label>
            <label className="flex h-[84px] items-center gap-5 rounded-[26px] border border-paw-cocoa/10 bg-white/84 px-6 shadow-soft backdrop-blur">
              <UserRound size={28} className="shrink-0 text-paw-pink" />
              <span className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="text-sm font-black text-paw-cocoa/75">Username</span>
                <input
                  className="w-full bg-transparent text-xl font-bold outline-none placeholder:text-paw-cocoa/45"
                  placeholder="Choose a username"
                  value={profileUsername}
                  onChange={(event) => setProfileUsername(event.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                  minLength={3}
                  maxLength={32}
                  required
                />
              </span>
            </label>
            <label className="flex min-h-[118px] items-start gap-5 rounded-[26px] border border-paw-cocoa/10 bg-white/84 px-6 py-5 shadow-soft backdrop-blur">
              <PawPrint size={28} className="mt-1 shrink-0 text-paw-pink" />
              <span className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="text-sm font-black text-paw-cocoa/75">Bio</span>
                <textarea
                  className="min-h-[66px] w-full resize-none bg-transparent text-lg font-bold leading-snug outline-none placeholder:text-paw-cocoa/45"
                  placeholder="Share a little about you and your cat"
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  maxLength={300}
                  required
                />
              </span>
            </label>
            <label className="flex h-[84px] items-center gap-5 rounded-[26px] border border-paw-cocoa/10 bg-white/84 px-6 shadow-soft backdrop-blur">
              <MapPin size={28} className="shrink-0 text-paw-pink" />
              <span className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="text-sm font-black text-paw-cocoa/75">City</span>
                <input
                  className="w-full bg-transparent text-xl font-bold outline-none placeholder:text-paw-cocoa/45"
                  placeholder="Kuala Lumpur"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  maxLength={80}
                  required
                />
              </span>
            </label>
            <button
              type="submit"
              className="mt-6 inline-flex h-[72px] w-full items-center justify-center gap-3 rounded-[30px] border border-white/70 bg-gradient-to-r from-paw-pink to-paw-rose text-2xl font-black text-white shadow-[0_14px_30px_rgba(247,101,137,0.28)] disabled:opacity-70"
              disabled={isSavingProfile}
            >
              {isSavingProfile ? "Saving..." : "Complete Profile"}
              <PawPrint size={30} className="fill-white/25" />
            </button>
            {setupError ? (
              <p className="rounded-xl bg-paw-blush px-3 py-2 text-center text-xs font-extrabold text-paw-pink">
                {setupError}
              </p>
            ) : null}
          </form>
        ) : (
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
        )}

        {!needsProfileSetup ? (
          <>
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
          </>
        ) : null}
      </div>
      {successTitle ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-paw-ink/35 px-6 backdrop-blur-md">
          <div className="relative w-full max-w-[330px] overflow-hidden rounded-[34px] border-2 border-paw-peach/70 bg-[#fff8ee]/95 px-7 py-8 text-center shadow-[0_24px_70px_rgba(58,34,26,0.28)]">
            <PawPrint className="absolute left-7 top-8 h-10 w-10 rotate-[-14deg] fill-paw-peach/20 text-paw-peach/20" />
            <Sparkles className="absolute right-8 top-10 h-7 w-7 fill-paw-butter text-paw-butter" />
            <Heart className="absolute bottom-8 right-10 h-7 w-7 rotate-[-10deg] fill-paw-pink/40 text-paw-pink/40" />

            <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-paw-blush text-paw-pink shadow-[0_18px_35px_rgba(247,101,137,0.22)] ring-8 ring-white/70">
              <PawPrint className="h-14 w-14 fill-paw-pink/30" />
            </div>
            <h2 className="mt-6 text-[30px] font-black leading-tight text-paw-cocoa">
              {successTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-[230px] text-base font-black leading-relaxed text-paw-cocoa/75">
              {successMessage}
            </p>
            <button
              type="button"
              onClick={continueToHome}
              className="mt-6 inline-flex h-14 w-full items-center justify-center gap-3 rounded-[24px] bg-gradient-to-r from-paw-pink to-paw-rose text-lg font-black text-white shadow-[0_14px_30px_rgba(247,101,137,0.28)]"
            >
              Continue
              <PawPrint className="h-6 w-6 fill-white/25" />
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
