"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Bell, Bookmark, CalendarCheck, ChevronRight, Edit3, LogOut, PawPrint, Settings, Users, X } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { apiFetch, clearGuestMode, clearToken, isGuestMode, requireSignedIn, type PublicUser } from "@/lib/api-client";
import { currentUser } from "@/data/mockData";
import profileIcon from "../../../images/profileIcon.png";

type ProfilePanel = "pawpals" | "saved" | "visits" | "notifications" | "settings" | null;

const profileActions = [
  { label: "My PawPals", panel: "pawpals" as const, icon: Users },
  { label: "Saved Posts", panel: "saved" as const, icon: Bookmark },
  { label: "My Vet Visits", panel: "visits" as const, icon: CalendarCheck },
  { label: "Notifications", panel: "notifications" as const, icon: Bell },
  { label: "Settings", panel: "settings" as const, icon: Settings }
];

export default function UserProfilePage() {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [user, setUser] = useState<PublicUser | null>(null);
  const [name, setName] = useState(currentUser.name);
  const [username, setUsername] = useState("catlover");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [activePanel, setActivePanel] = useState<ProfilePanel>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [guest, setGuest] = useState(false);

  useEffect(() => {
    if (isGuestMode()) {
      setGuest(true);
      setUser(null);
      setName("Guest");
      setUsername("guest");
      setCity("");
      setBio("");
      return;
    }

    apiFetch<{ user: PublicUser & { bio?: string | null } }>("/api/auth/me")
      .then((data) => {
        setUser(data.user);
        setName(data.user.name);
        setUsername(data.user.username);
        setCity(data.user.city ?? "");
        setBio(data.user.bio ?? "");
      })
      .catch(() => undefined);
  }, []);

  const displayName = guest ? "Guest" : user?.name ?? name;
  const displayRole = guest ? "Browsing PawPals" : user ? `@${user.username}` : currentUser.role;
  const avatar = user?.avatarUrl ?? currentUser.catAvatar;
  const stats = guest
    ? { posts: 0, followers: 0, following: 0 }
    : currentUser.stats;

  function openEditProfile() {
    try {
      requireSignedIn();
      setShowEdit(true);
      setStatus("");
    } catch {
      setStatus("");
    }
  }

  function openPanel(panel: ProfilePanel) {
    try {
      requireSignedIn();
      setActivePanel(panel);
      setStatus("");
    } catch {
      setStatus("");
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setStatus("");
    try {
      requireSignedIn();
      const data = await apiFetch<{ user: PublicUser & { bio?: string | null } }>("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          name,
          username,
          city: city || null,
          bio: bio || null
        })
      });
      setUser(data.user);
      setShowEdit(false);
      setStatus("Profile updated");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not update profile");
    } finally {
      setIsSaving(false);
    }
  }

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    clearToken();
    clearGuestMode();
    router.push("/");
  }

  return (
    <section className="min-h-screen bg-paw-radial pb-28">
      <div className={`relative overflow-visible bg-paw-lavender ${guest ? "mb-28 h-36" : "mb-16 h-44"}`}>
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle,#fff_2px,transparent_2px)] [background-size:34px_34px]" />
        {!guest ? (
          <button
            className="absolute right-5 top-6 grid h-10 w-10 place-items-center rounded-full bg-white/35 text-white"
            type="button"
            onClick={openEditProfile}
            aria-label="Edit profile"
          >
            <Edit3 size={18} />
          </button>
        ) : null}
        <div className={`absolute left-1/2 w-full max-w-[240px] -translate-x-1/2 text-center ${guest ? "-bottom-24" : "-bottom-14"}`}>
          {guest ? (
            <div className="mx-auto grid h-24 w-24 place-items-center overflow-hidden rounded-full border-4 border-paw-cream bg-white shadow-soft">
              <img src={profileIcon.src} alt="Guest" className="h-full w-full object-cover" />
            </div>
          ) : (
            <img
              src={avatar}
              alt={displayName}
              className="mx-auto h-28 w-28 rounded-full border-4 border-paw-cream object-cover shadow-soft"
            />
          )}
          <h1 className="mt-4 text-xl font-black leading-none text-paw-ink">{displayName}</h1>
          <p className="mt-2 text-xs font-bold leading-none text-paw-cocoa/70">{displayRole}</p>
          {guest ? (
            <button
              type="button"
              onClick={() => router.push("/auth?mode=login")}
              className="mt-4 h-10 rounded-full bg-paw-pink px-8 text-xs font-black text-white shadow-soft"
            >
              Log In
            </button>
          ) : null}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 px-8 text-center">
        <button type="button" onClick={() => openPanel("saved")}>
          <p className="text-lg font-black">{stats.posts}</p>
          <p className="text-xs font-bold text-paw-cocoa/70">Posts</p>
        </button>
        <button type="button" onClick={() => openPanel("pawpals")}>
          <p className="text-lg font-black">{stats.followers}</p>
          <p className="text-xs font-bold text-paw-cocoa/70">Followers</p>
        </button>
        <button type="button" onClick={() => openPanel("pawpals")}>
          <p className="text-lg font-black">{stats.following}</p>
          <p className="text-xs font-bold text-paw-cocoa/70">Following</p>
        </button>
      </div>

      <div className="px-5">
        {status ? <p className="mb-3 text-xs font-extrabold text-paw-pink">{status}</p> : null}
        <section className="paw-card overflow-hidden rounded-3xl">
          {profileActions.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => openPanel(item.panel)}
                className={`flex h-16 w-full items-center gap-4 px-5 text-left ${
                  index !== profileActions.length - 1 ? "border-b border-paw-cocoa/10" : ""
                }`}
              >
                <Icon size={19} className="text-paw-cocoa" />
                <span className="flex-1 text-sm font-extrabold">{item.label}</span>
                <ChevronRight size={18} className="text-paw-cocoa/55" />
              </button>
            );
          })}
        </section>
      </div>

      {showEdit ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-paw-ink/30 px-5 backdrop-blur-sm">
          <form onSubmit={saveProfile} className="w-full max-w-[360px] rounded-[26px] bg-paw-cream p-5 shadow-paw">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black">Edit Profile</h2>
              <button type="button" onClick={() => setShowEdit(false)} className="grid h-9 w-9 place-items-center rounded-full bg-white/70" aria-label="Close edit profile">
                <X size={18} />
              </button>
            </div>
            <label className="mb-3 block">
              <span className="mb-1 block text-xs font-black text-paw-cocoa/70">Name</span>
              <input className="paw-input h-11 w-full rounded-xl px-4 text-sm font-bold" value={name} onChange={(event) => setName(event.target.value)} required />
            </label>
            <label className="mb-3 block">
              <span className="mb-1 block text-xs font-black text-paw-cocoa/70">Username</span>
              <input className="paw-input h-11 w-full rounded-xl px-4 text-sm font-bold" value={username} onChange={(event) => setUsername(event.target.value)} required />
            </label>
            <label className="mb-3 block">
              <span className="mb-1 block text-xs font-black text-paw-cocoa/70">City</span>
              <input className="paw-input h-11 w-full rounded-xl px-4 text-sm font-bold" value={city} onChange={(event) => setCity(event.target.value)} />
            </label>
            <label className="mb-4 block">
              <span className="mb-1 block text-xs font-black text-paw-cocoa/70">Bio</span>
              <textarea className="paw-input min-h-24 w-full resize-none rounded-xl px-4 py-3 text-sm font-bold" value={bio} onChange={(event) => setBio(event.target.value)} maxLength={300} />
            </label>
            <button type="submit" disabled={isSaving} className="h-12 w-full rounded-xl bg-paw-pink text-sm font-extrabold text-white shadow-soft disabled:opacity-70">
              {isSaving ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>
      ) : null}

      {activePanel ? (
        <div className="fixed inset-x-0 bottom-0 z-[60] mx-auto max-w-[430px] rounded-t-[28px] bg-paw-cream p-5 shadow-paw">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black">
              {activePanel === "pawpals"
                ? "My PawPals"
                : activePanel === "saved"
                  ? "Saved Posts"
                  : activePanel === "visits"
                    ? "My Vet Visits"
                    : activePanel === "notifications"
                      ? "Notifications"
                      : "Settings"}
            </h2>
            <button type="button" onClick={() => setActivePanel(null)} className="grid h-9 w-9 place-items-center rounded-full bg-white/70" aria-label="Close panel">
              <X size={18} />
            </button>
          </div>

          {activePanel === "pawpals" ? (
            <div className="grid gap-3">
              {["Luna's Mom", "CatDad", "MeowMemes"].map((name) => (
                <button key={name} type="button" onClick={() => router.push("/discover")} className="flex h-14 items-center gap-3 rounded-2xl bg-white/70 px-4 text-left">
                  <PawPrint className="text-paw-pink" size={18} />
                  <span className="text-sm font-extrabold">{name}</span>
                </button>
              ))}
            </div>
          ) : null}

          {activePanel === "saved" ? (
            <div className="grid gap-3">
              <button type="button" onClick={() => router.push("/community")} className="h-12 rounded-xl bg-white/70 text-sm font-extrabold text-paw-cocoa">
                View Saved Posts
              </button>
              <button type="button" onClick={() => router.push("/events")} className="h-12 rounded-xl bg-white/70 text-sm font-extrabold text-paw-cocoa">
                View Saved Events
              </button>
            </div>
          ) : null}

          {activePanel === "visits" ? (
            <div className="grid gap-3">
              <p className="rounded-2xl bg-white/70 px-4 py-3 text-sm font-bold text-paw-cocoa">No upcoming visits yet.</p>
              <button type="button" onClick={() => router.push("/vets")} className="h-12 rounded-xl bg-paw-lavender text-sm font-extrabold text-white shadow-soft">
                Book a Vet Visit
              </button>
            </div>
          ) : null}

          {activePanel === "notifications" ? (
            <div className="grid gap-3">
              {["New tips are available today.", "Remember to refresh your cat's water.", "Check nearby events this week."].map((item) => (
                <p key={item} className="rounded-2xl bg-white/70 px-4 py-3 text-sm font-bold text-paw-cocoa">{item}</p>
              ))}
            </div>
          ) : null}

          {activePanel === "settings" ? (
            <div className="grid gap-3">
              <button type="button" onClick={openEditProfile} className="h-12 rounded-xl bg-white/70 text-sm font-extrabold text-paw-cocoa">
                Edit Profile
              </button>
              <button type="button" onClick={() => router.push("/auth?mode=login")} className="h-12 rounded-xl bg-white/70 text-sm font-extrabold text-paw-cocoa">
                Switch Account
              </button>
              <button type="button" onClick={logout} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-paw-pink text-sm font-extrabold text-white shadow-soft">
                <LogOut size={17} />
                Log Out
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <BottomNav />
    </section>
  );
}
