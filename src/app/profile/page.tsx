"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Bell, Bookmark, CalendarCheck, Camera, ChevronRight, Edit3, FileText, Heart, LogOut, MapPin, PawPrint, Settings, Users, X } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { apiFetch, clearGuestMode, clearToken, isGuestMode, requireSignedIn, type ApiPost, type PublicUser } from "@/lib/api-client";
import { currentUser } from "@/data/mockData";
import profile1 from "../../../images/profile1.png";
import profileBg from "../../../images/profileBg.png";
import profileIcon from "../../../images/profileIcon.png";

type ProfilePanel = "posts" | "followers" | "following" | "saved" | "visits" | "notifications" | "settings" | null;

type ProfileStats = {
  posts: number;
  followers: number;
  following: number;
};

const profileActions = [
  { label: "My PawPals", panel: "followers" as const, icon: Users, bubble: "bg-[#eee4ff] text-paw-lavender" },
  { label: "Saved Posts", panel: "saved" as const, icon: Bookmark, bubble: "bg-[#ffe1ec] text-paw-pink" },
  { label: "My Vet Visits", panel: "visits" as const, icon: CalendarCheck, bubble: "bg-[#ffead5] text-[#ff9a56]" },
  { label: "Notifications", panel: "notifications" as const, icon: Bell, bubble: "bg-[#eee4ff] text-paw-lavender" },
  { label: "Settings", panel: "settings" as const, icon: Settings, bubble: "bg-[#dcf5df] text-[#47c95a]" }
];

export default function UserProfilePage() {
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);
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
  const [avatarPreview, setAvatarPreview] = useState(currentUser.catAvatar);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [stats, setStats] = useState<ProfileStats>({ posts: 0, followers: 0, following: 0 });
  const [profilePosts, setProfilePosts] = useState<ApiPost[]>([]);
  const [followers, setFollowers] = useState<PublicUser[]>([]);
  const [following, setFollowing] = useState<PublicUser[]>([]);

  useEffect(() => {
    if (isGuestMode()) {
      setGuest(true);
      setUser(null);
      setName("Guest");
      setUsername("guest");
      setCity("");
      setBio("");
      setStats({ posts: 0, followers: 0, following: 0 });
      return;
    }

    apiFetch<{ user: PublicUser & { bio?: string | null } }>("/api/auth/me")
      .then((data) => {
        setUser(data.user);
        setName(data.user.name);
        setUsername(data.user.username);
        setCity(data.user.city ?? "");
        setBio(data.user.bio ?? "");
        setAvatarPreview(data.user.avatarUrl ?? currentUser.catAvatar);
        void loadProfileData(data.user.id);
      })
      .catch(() => undefined);
  }, []);

  const displayName = guest ? "Guest" : user?.name ?? name;
  const displayRole = guest ? "Browsing PawPals" : user ? `@${user.username}` : currentUser.role;
  const avatar = user?.avatarUrl ?? currentUser.catAvatar;

  async function loadProfileData(userId: string) {
    try {
      const [profileData, postsData, followersData, followingData] = await Promise.all([
        apiFetch<{ stats: ProfileStats }>(`/api/users/${userId}`),
        apiFetch<ApiPost[]>(`/api/posts?authorId=${userId}&limit=20`),
        apiFetch<PublicUser[]>(`/api/users/${userId}/followers?limit=50`),
        apiFetch<PublicUser[]>(`/api/users/${userId}/following?limit=50`)
      ]);
      setStats(profileData.stats);
      setProfilePosts(postsData);
      setFollowers(followersData);
      setFollowing(followingData);
    } catch {
      setStats({ posts: 0, followers: 0, following: 0 });
    }
  }

  function openEditProfile() {
    try {
      requireSignedIn();
      setAvatarPreview(user?.avatarUrl ?? currentUser.catAvatar);
      setAvatarFile(null);
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

  function chooseAvatar(file: File | null | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStatus("Please choose an image file.");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
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
      let nextUser = data.user;
      if (avatarFile) {
        const formData = new FormData();
        formData.append("file", avatarFile);
        const avatarData = await apiFetch<{ user: PublicUser; avatarUrl: string }>("/api/users/me/avatar", {
          method: "POST",
          body: formData
        });
        nextUser = avatarData.user;
        setAvatarPreview(avatarData.avatarUrl);
        setAvatarFile(null);
      }
      setUser(nextUser);
      setCity(nextUser.city ?? "");
      setBio(nextUser.bio ?? "");
      void loadProfileData(nextUser.id);
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
    <section
      className="relative h-screen overflow-hidden bg-[#fff8ef] pb-[84px]"
      style={{
        backgroundImage: `url(${profileBg.src})`,
        backgroundPosition: "center top",
        backgroundSize: "cover",
        backgroundAttachment: "fixed"
      }}
    >
      <div className="relative h-[170px] overflow-visible">
        {!guest ? (
          <button
            className="absolute right-5 top-6 grid h-12 w-12 place-items-center rounded-full bg-white text-paw-lavender shadow-soft"
            type="button"
            onClick={openEditProfile}
            aria-label="Edit profile"
          >
            <Edit3 size={22} />
          </button>
        ) : null}
        <div className="absolute bottom-[-54px] left-1/2 z-10 w-full max-w-[220px] -translate-x-1/2 text-center">
          {guest ? (
            <div className="relative mx-auto grid h-24 w-24 place-items-center overflow-hidden rounded-full border-[5px] border-white bg-white shadow-soft">
              <img src={profileIcon.src} alt="Guest" className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="relative mx-auto h-24 w-24">
              <img
                src={avatar}
                alt={displayName}
                className="h-full w-full rounded-full border-[5px] border-white object-cover shadow-soft"
              />
              <span className="absolute bottom-0 right-0 grid h-9 w-9 place-items-center rounded-full bg-white text-paw-pink shadow-soft">
                <PawPrint size={20} className="fill-paw-pink/25" />
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 pt-[62px] text-center">
        <h1 className="text-[25px] font-black leading-none text-paw-ink">
          {displayName} {!guest ? <Heart size={18} className="inline -translate-y-1 fill-paw-lavender text-paw-lavender" /> : null}
        </h1>
        <p className="mt-1.5 text-sm font-black leading-none text-paw-cocoa/70">{displayRole}</p>
          {guest ? (
            <button
              type="button"
              onClick={() => router.push("/auth?mode=login")}
              className="mt-3 h-9 rounded-full bg-paw-pink px-7 text-xs font-black text-white shadow-soft"
            >
              Log In
            </button>
          ) : null}
      </div>

      <div className="mx-6 mt-4 grid grid-cols-3 overflow-hidden rounded-[22px] bg-white/82 py-3 text-center shadow-soft">
        <button type="button" onClick={() => openPanel("posts")} className="border-r border-paw-cocoa/10">
          <span className="mx-auto mb-1.5 grid h-9 w-9 place-items-center rounded-xl bg-[#eee4ff] text-paw-lavender">
            <FileText size={17} />
          </span>
          <p className="text-lg font-black leading-none text-paw-ink">{stats.posts}</p>
          <p className="mt-1 text-xs font-bold text-paw-cocoa/70">Posts</p>
        </button>
        <button type="button" onClick={() => openPanel("followers")} className="border-r border-paw-cocoa/10">
          <span className="mx-auto mb-1.5 grid h-9 w-9 place-items-center rounded-xl bg-[#ffe1ec] text-paw-pink">
            <Users size={18} />
          </span>
          <p className="text-lg font-black leading-none text-paw-ink">{stats.followers}</p>
          <p className="mt-1 text-xs font-bold text-paw-cocoa/70">Followers</p>
        </button>
        <button type="button" onClick={() => openPanel("following")}>
          <span className="mx-auto mb-1.5 grid h-9 w-9 place-items-center rounded-xl bg-[#ffead5] text-[#ff9a56]">
            <PawPrint size={18} className="fill-[#ff9a56]/25" />
          </span>
          <p className="text-lg font-black leading-none text-paw-ink">{stats.following}</p>
          <p className="mt-1 text-xs font-bold text-paw-cocoa/70">Following</p>
        </button>
      </div>

      <div className="mt-3 px-6">
        {status ? <p className="mb-3 text-xs font-extrabold text-paw-pink">{status}</p> : null}
        {!guest ? (
          <section className="relative mb-3 min-h-[74px] overflow-hidden rounded-[22px] bg-white/82 p-3 shadow-soft">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#eee4ff] text-paw-lavender">
                <MapPin size={24} className="fill-paw-lavender/20" />
              </span>
              <div className="min-w-0 pr-16 text-left">
                <p className="truncate text-base font-black text-paw-ink">{city || "City not set"}</p>
                <p className="mt-0.5 line-clamp-2 text-xs font-bold leading-snug text-paw-cocoa/75">
                  {bio || "No bio yet. Add a short intro so PawPals know more about you."}
                </p>
              </div>
            </div>
            <img
              src={profile1.src}
              alt=""
              className="pointer-events-none absolute -bottom-4 -right-4 h-20 w-20 object-contain"
            />
          </section>
        ) : null}
        <section className="overflow-hidden rounded-[22px] bg-white/86 shadow-soft">
          {profileActions.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => openPanel(item.panel)}
                className={`flex h-[52px] w-full items-center gap-3 px-4 text-left ${
                  index !== profileActions.length - 1 ? "border-b border-paw-cocoa/10" : ""
                }`}
              >
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${item.bubble}`}>
                  <Icon size={18} />
                </span>
                <span className="flex-1 text-sm font-black text-paw-ink">{item.label}</span>
                <span className="flex items-center gap-3">
                  {item.panel === "notifications" ? <span className="h-3 w-3 rounded-full bg-paw-pink" /> : null}
                  <ChevronRight size={19} className="text-paw-cocoa/45" />
                </span>
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
            <div className="mb-4 flex items-center gap-4 rounded-3xl bg-white/60 p-3">
              <img src={avatarPreview} alt={name} className="h-20 w-20 rounded-full object-cover ring-4 ring-paw-cream" />
              <div className="flex-1">
                <p className="text-sm font-black text-paw-ink">Profile Picture</p>
                <p className="mt-1 text-xs font-bold text-paw-cocoa/65">Choose a new photo for your profile.</p>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-paw-pink px-4 text-xs font-black text-white shadow-soft"
                >
                  <Camera size={15} />
                  Change Photo
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    chooseAvatar(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
              </div>
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
              {activePanel === "posts"
                ? "My Posts"
                : activePanel === "followers"
                  ? "Followers"
                  : activePanel === "following"
                    ? "Following"
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

          {activePanel === "posts" ? (
            <div className="grid max-h-[55vh] gap-3 overflow-y-auto pb-2">
              {profilePosts.length ? (
                profilePosts.map((post) => (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => router.push("/community")}
                    className="rounded-2xl bg-white/70 px-4 py-3 text-left"
                  >
                    <p className="line-clamp-2 text-sm font-extrabold text-paw-ink">{post.text}</p>
                    <p className="mt-2 text-xs font-bold text-paw-cocoa/65">
                      {post._count?.likes ?? 0} likes - {post._count?.comments ?? 0} comments
                    </p>
                  </button>
                ))
              ) : (
                <p className="rounded-2xl bg-white/70 px-4 py-3 text-sm font-bold text-paw-cocoa">No posts yet.</p>
              )}
            </div>
          ) : null}

          {activePanel === "followers" || activePanel === "following" ? (
            <div className="grid gap-3">
              {(activePanel === "followers" ? followers : following).length ? (
                (activePanel === "followers" ? followers : following).map((person) => (
                  <button key={person.id} type="button" onClick={() => router.push("/discover")} className="flex h-16 items-center gap-3 rounded-2xl bg-white/70 px-4 text-left">
                    <img src={person.avatarUrl ?? currentUser.catAvatar} alt={person.name} className="h-11 w-11 rounded-full object-cover" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-extrabold">{person.name}</span>
                      <span className="block truncate text-xs font-bold text-paw-cocoa/65">@{person.username}</span>
                    </span>
                  </button>
                ))
              ) : (
                <p className="rounded-2xl bg-white/70 px-4 py-3 text-sm font-bold text-paw-cocoa">
                  {activePanel === "followers" ? "No followers yet." : "You are not following anyone yet."}
                </p>
              )}
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
