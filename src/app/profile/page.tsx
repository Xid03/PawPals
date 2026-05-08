"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AtSign, Bell, Bookmark, CalendarCheck, Camera, ChevronRight, Edit3, FileText, Heart, ImageIcon, ImagePlus, Lock, LogOut, MapPin, MessageCircle, PawPrint, Plus, Settings, Sparkles, UserRound, Users, X } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { useCurrentUser } from "@/components/CurrentUserProvider";
import { StatusToast } from "@/components/StatusToast";
import { apiFetch, clearGuestMode, clearToken, isGuestMode, requireSignedIn, type ApiPost, type PublicUser } from "@/lib/api-client";
import { currentUser } from "@/data/mockData";
import homepageImage from "../../../images/homepage.png";
import profile1 from "../../../images/profile1.png";
import profileBg from "../../../images/profileBg.png";
import profileIcon from "../../../images/profileIcon.png";

type ProfilePanel = "posts" | "followers" | "following" | "saved" | "notifications" | "settings" | null;

type ProfileStats = {
  posts: number;
  followers: number;
  following: number;
};

type FollowRequest = {
  id: string;
  requester: PublicUser;
  createdAt: string;
};

type ProfileStory = {
  id: string;
  authorId: string;
  url: string;
  type: "IMAGE" | "VIDEO";
  caption?: string | null;
  createdAt: string;
  expiresAt: string;
  author?: PublicUser;
  _count?: {
    views: number;
  };
};

function isStoryActive(story: { expiresAt: string }) {
  return new Date(story.expiresAt).getTime() > Date.now();
}

function sortStoriesByUploadTime<T extends { createdAt: string }>(stories: T[]) {
  return [...stories].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

const profileActions = [
  { label: "My PawPals", panel: "followers" as const, icon: Users, bubble: "bg-[#eee4ff] text-paw-lavender" },
  { label: "Saved Posts", panel: "saved" as const, icon: Bookmark, bubble: "bg-[#ffe1ec] text-paw-pink" },
  { label: "Notifications", panel: "notifications" as const, icon: Bell, bubble: "bg-[#eee4ff] text-paw-lavender" },
  { label: "Settings", panel: "settings" as const, icon: Settings, bubble: "bg-[#dcf5df] text-[#47c95a]" }
];

export default function UserProfilePage() {
  const router = useRouter();
  const { currentUser: initialUser, setCurrentUser } = useCurrentUser();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("");
  const [user, setUser] = useState<PublicUser | null>(initialUser);
  const [name, setName] = useState(initialUser?.name || currentUser.name);
  const [username, setUsername] = useState(initialUser?.username || "catlover");
  const [city, setCity] = useState(initialUser?.city ?? "");
  const [bio, setBio] = useState(initialUser?.bio ?? "");
  const [isPrivate, setIsPrivate] = useState(initialUser?.isPrivate ?? false);
  const [showEdit, setShowEdit] = useState(false);
  const [activePanel, setActivePanel] = useState<ProfilePanel>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [guest, setGuest] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(initialUser?.avatarUrl || currentUser.catAvatar);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [stats, setStats] = useState<ProfileStats>({ posts: 0, followers: 0, following: 0 });
  const [profilePosts, setProfilePosts] = useState<ApiPost[]>([]);
  const [followers, setFollowers] = useState<PublicUser[]>([]);
  const [following, setFollowing] = useState<PublicUser[]>([]);
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([]);
  const [isLoadingFollowRequests, setIsLoadingFollowRequests] = useState(false);
  const [stories, setStories] = useState<ProfileStory[]>([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [isLoadingStories, setIsLoadingStories] = useState(false);
  const [showAddStory, setShowAddStory] = useState(false);
  const [storyFile, setStoryFile] = useState<File | null>(null);
  const [storyPreview, setStoryPreview] = useState("");
  const [storyCaption, setStoryCaption] = useState("");
  const [isPostingStory, setIsPostingStory] = useState(false);
  const [storyViewers, setStoryViewers] = useState<PublicUser[]>([]);
  const [showStoryViewers, setShowStoryViewers] = useState(false);
  const [isLoadingStoryViewers, setIsLoadingStoryViewers] = useState(false);

  useEffect(() => {
    if (isGuestMode()) {
      setGuest(true);
      setUser(null);
      setName("Guest");
      setUsername("guest");
      setCity("");
      setBio("");
      setIsPrivate(false);
      setStats({ posts: 0, followers: 0, following: 0 });
      setStories([]);
      return;
    }

    apiFetch<{ user: PublicUser & { bio?: string | null } }>("/api/auth/me")
      .then((data) => {
        setCurrentUser(data.user);
        setUser(data.user);
        setName(data.user.name);
        setUsername(data.user.username);
        setCity(data.user.city ?? "");
        setBio(data.user.bio ?? "");
        setIsPrivate(data.user.isPrivate ?? false);
        setAvatarPreview(data.user.avatarUrl ?? currentUser.catAvatar);
        void loadProfileData(data.user.id);
      })
      .catch(() => undefined);
  }, [setCurrentUser]);

  const displayName = guest ? "Guest" : user?.name ?? name;
  const displayRole = guest ? "Browsing PawPals" : user ? `@${user.username}` : currentUser.role;
  const avatar = user?.avatarUrl ?? currentUser.catAvatar;
  const activeStory = activeStoryIndex === null ? null : stories[activeStoryIndex] ?? null;
  const activePanelTitle =
    activePanel === "posts"
      ? "My Posts"
      : activePanel === "followers"
        ? "My PawPals"
        : activePanel === "following"
          ? "Following"
          : activePanel === "saved"
            ? "Saved Posts"
            : activePanel === "notifications"
              ? "Notifications"
              : "Settings";

  async function loadProfileData(userId: string) {
    const [profileResult, postsResult, followersResult, followingResult, storiesResult] = await Promise.allSettled([
      apiFetch<{ stats: ProfileStats }>(`/api/users/${userId}`),
      apiFetch<ApiPost[]>(`/api/posts?authorId=${userId}&limit=20`),
      apiFetch<PublicUser[]>(`/api/users/${userId}/followers?limit=50`),
      apiFetch<PublicUser[]>(`/api/users/${userId}/following?limit=50`),
      apiFetch<ProfileStory[]>("/api/stories?mine=true&limit=50")
    ]);

    if (profileResult.status === "fulfilled") {
      setStats(profileResult.value.stats);
    } else {
      setStats({ posts: 0, followers: 0, following: 0 });
    }
    if (postsResult.status === "fulfilled") setProfilePosts(postsResult.value);
    if (followersResult.status === "fulfilled") setFollowers(followersResult.value);
    if (followingResult.status === "fulfilled") setFollowing(followingResult.value);
    if (storiesResult.status === "fulfilled") setStories(sortStoriesByUploadTime(storiesResult.value.filter(isStoryActive)));
  }

  async function loadFollowRequests() {
    setIsLoadingFollowRequests(true);
    try {
      const requests = await apiFetch<FollowRequest[]>("/api/follow-requests?limit=20");
      setFollowRequests(requests);
    } catch {
      setFollowRequests([]);
    } finally {
      setIsLoadingFollowRequests(false);
    }
  }

  function openEditProfile() {
    try {
      requireSignedIn();
      setActivePanel(null);
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
      if (panel === "notifications") {
        void loadFollowRequests();
      }
    } catch {
      setStatus("");
    }
  }

  async function loadProfileStories() {
    setIsLoadingStories(true);
    try {
      const storiesData = await apiFetch<ProfileStory[]>("/api/stories?mine=true&limit=50");
      const activeStories = sortStoriesByUploadTime(storiesData.filter(isStoryActive));
      setStories(activeStories);
      return activeStories;
    } finally {
      setIsLoadingStories(false);
    }
  }

  async function openStoryViewer() {
    if (guest) return;
    if (!user?.id) return;
    const loadedStories = await loadProfileStories().catch(() => stories);
    if (!loadedStories.length) {
      setStatus("No stories uploaded yet.");
      return;
    }
    setActiveStoryIndex(0);
  }

  function showNextStory() {
    setActiveStoryIndex((current) => {
      if (current === null) return null;
      return current + 1 < stories.length ? current + 1 : null;
    });
  }

  function showPreviousStory() {
    setActiveStoryIndex((current) => {
      if (current === null) return null;
      return current > 0 ? current - 1 : current;
    });
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

  function chooseStoryFile(file: File | null | undefined) {
    if (storyPreview.startsWith("blob:")) URL.revokeObjectURL(storyPreview);
    setStoryFile(file ?? null);
    setStoryPreview(file ? URL.createObjectURL(file) : "");
  }

  function closeAddStory() {
    if (storyPreview.startsWith("blob:")) URL.revokeObjectURL(storyPreview);
    setStoryFile(null);
    setStoryPreview("");
    setStoryCaption("");
    setShowAddStory(false);
  }

  async function postStory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!storyFile || !storyPreview) {
      setStatus("Choose a photo first");
      return;
    }

    setIsPostingStory(true);
    try {
      requireSignedIn();
      const uploadForm = new FormData();
      uploadForm.append("file", storyFile);
      uploadForm.append("folder", "stories");
      const upload = await apiFetch<{ url: string }>("/api/uploads", {
        method: "POST",
        body: uploadForm
      });
      const created = await apiFetch<{ story: ProfileStory }>("/api/stories", {
        method: "POST",
        body: JSON.stringify({
          url: upload.url,
          type: "IMAGE",
          caption: storyCaption.trim() || undefined
        })
      });
      setStories((current) => sortStoriesByUploadTime([...current.filter((story) => story.id !== created.story.id), created.story]));
      closeAddStory();
      setStatus("Story posted.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not post story");
    } finally {
      setIsPostingStory(false);
    }
  }

  async function openStoryViewers(story: ProfileStory) {
    setShowStoryViewers(true);
    setIsLoadingStoryViewers(true);
    try {
      const viewers = await apiFetch<PublicUser[]>(`/api/stories/${story.id}/viewers?limit=50`);
      setStoryViewers(viewers);
    } catch (error) {
      setStoryViewers([]);
      setStatus(error instanceof Error ? error.message : "Could not load story viewers.");
    } finally {
      setIsLoadingStoryViewers(false);
    }
  }

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStories((current) => current.filter(isStoryActive));
      setActiveStoryIndex((current) => {
        if (current === null) return null;
        return stories[current] && isStoryActive(stories[current]) ? current : null;
      });
    }, 60_000);

    return () => window.clearInterval(timer);
  }, [stories]);

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
          bio: bio || null,
          isPrivate
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
      setCurrentUser(nextUser);
      setCity(nextUser.city ?? "");
      setBio(nextUser.bio ?? "");
      setIsPrivate(nextUser.isPrivate ?? false);
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

  async function toggleProfilePostSave(postId: string) {
    try {
      requireSignedIn();
      const result = await apiFetch<{ saved: boolean }>(`/api/posts/${postId}/save`, { method: "POST" });
      setProfilePosts((current) =>
        current.map((post) => (post.id === postId ? { ...post, savedByMe: result.saved } : post))
      );
      setStatus(result.saved ? "Post saved" : "Post removed from saved");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not update saved post");
    }
  }

  async function togglePrivateAccount() {
    const nextIsPrivate = !isPrivate;
    setIsPrivate(nextIsPrivate);
    setStatus("");
    try {
      requireSignedIn();
      const data = await apiFetch<{ user: PublicUser & { bio?: string | null } }>("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify({ isPrivate: nextIsPrivate })
      });
      setUser(data.user);
      setCurrentUser(data.user);
      setIsPrivate(data.user.isPrivate ?? false);
      setStatus(data.user.isPrivate ? "Private account enabled" : "Private account disabled");
    } catch (error) {
      setIsPrivate(!nextIsPrivate);
      setStatus(error instanceof Error ? error.message : "Could not update privacy");
    }
  }

  async function answerFollowRequest(requestId: string, action: "approve" | "reject") {
    try {
      const data = await apiFetch<{ following: boolean }>(`/api/follow-requests/${requestId}/${action}`, {
        method: "POST"
      });
      setFollowRequests((current) => current.filter((request) => request.id !== requestId));
      if (data.following) {
        setStats((current) => ({ ...current, followers: current.followers + 1 }));
      }
      setStatus(action === "approve" ? "Follow request approved" : "Follow request rejected");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not update follow request");
    }
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
            <button
              type="button"
              onClick={openStoryViewer}
              disabled={isLoadingStories}
              className="relative mx-auto block h-24 w-24 rounded-full focus:outline-none focus:ring-4 focus:ring-paw-pink/30 disabled:opacity-80"
              aria-label="View your stories"
            >
              <span className={`absolute inset-[-4px] rounded-full ${stories.length ? "bg-gradient-to-tr from-paw-pink via-paw-lavender to-paw-butter p-[3px]" : "bg-transparent"}`}>
                <span className="block h-full w-full rounded-full bg-white" />
              </span>
              <img
                src={avatar}
                alt={displayName}
                className="relative h-full w-full rounded-full border-[5px] border-white object-cover shadow-soft"
              />
              <span className="absolute bottom-0 right-0 grid h-9 w-9 place-items-center rounded-full bg-white text-paw-pink shadow-soft">
                {isLoadingStories ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-paw-pink/30 border-t-paw-pink" />
                ) : (
                  <PawPrint size={20} className="fill-paw-pink/25" />
                )}
              </span>
            </button>
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
        <StatusToast message={status} onDismiss={() => setStatus("")} />
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
                  <ChevronRight size={19} className="text-paw-cocoa/45" />
                </span>
              </button>
            );
          })}
        </section>
      </div>

      {showEdit ? (
        <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-paw-ink/35 px-5 py-5 backdrop-blur-sm">
          <form onSubmit={saveProfile} className="relative w-full max-w-[360px] overflow-hidden rounded-[30px] border-2 border-paw-peach/70 bg-[#fff8ee]/95 px-5 py-5 shadow-[0_24px_70px_rgba(58,34,26,0.28)]">
            <div className="pointer-events-none absolute -bottom-16 -left-10 h-28 w-40 rounded-[48%] bg-paw-blush/45" />
            <div className="pointer-events-none absolute -bottom-16 -right-10 h-28 w-40 rounded-[48%] bg-paw-blush/45" />
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-[30px] font-black leading-none text-paw-ink">
                Edit Profile
                <PawPrint className="h-7 w-7 fill-paw-pink/55 text-paw-pink" />
                <Sparkles className="h-4 w-4 fill-paw-butter text-paw-butter" />
              </h2>
              <button type="button" onClick={() => setShowEdit(false)} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/80 text-paw-cocoa shadow-[0_10px_24px_rgba(122,81,63,0.12)]" aria-label="Close edit profile">
                <X size={24} strokeWidth={3} />
              </button>
            </div>
            <div className="relative mb-4 flex items-center gap-4 rounded-[24px] border border-paw-peach/55 bg-white/45 p-4 shadow-[0_10px_24px_rgba(122,81,63,0.06)]">
              <PawPrint className="pointer-events-none absolute right-5 top-6 h-10 w-10 rotate-12 fill-paw-peach/20 text-paw-peach/20" />
              <div className="relative shrink-0">
                <img src={avatarPreview} alt={name} className="h-24 w-24 rounded-full object-cover ring-[5px] ring-white shadow-[0_10px_24px_rgba(122,81,63,0.12)]" />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 grid h-11 w-11 place-items-center rounded-full border-4 border-white bg-paw-rose text-white shadow-soft"
                  aria-label="Change profile photo"
                >
                  <Camera size={21} />
                </button>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[20px] font-black leading-tight text-paw-ink">Profile Picture</p>
                <p className="mt-1 text-sm font-bold leading-snug text-paw-cocoa/70">Choose a new photo for your profile.</p>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-[18px] bg-gradient-to-r from-paw-pink to-paw-rose px-5 text-sm font-black text-white shadow-[0_14px_28px_rgba(247,101,137,0.28)]"
                >
                  <Camera size={17} />
                  Change Photo
                </button>
              </div>
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
            <label className="mb-3 block">
              <span className="mb-1.5 flex items-center gap-2 text-sm font-black text-paw-cocoa/75">
                <span className="h-2 w-2 rounded-full bg-paw-rose" />
                Name
              </span>
              <span className="flex h-[52px] items-center overflow-hidden rounded-[20px] border border-paw-peach/55 bg-white/70 shadow-[0_10px_22px_rgba(122,81,63,0.06)]">
                <span className="grid h-full w-14 shrink-0 place-items-center bg-paw-blush/30 text-paw-pink">
                  <UserRound size={23} />
                </span>
                <input className="min-w-0 flex-1 bg-transparent px-4 text-lg font-black text-paw-ink outline-none" value={name} onChange={(event) => setName(event.target.value)} required />
                <Heart className="mr-4 h-4 w-4 fill-paw-blush text-paw-blush" />
              </span>
            </label>
            <label className="mb-3 block">
              <span className="mb-1.5 flex items-center gap-2 text-sm font-black text-paw-cocoa/75">
                <span className="h-2 w-2 rounded-full bg-paw-rose" />
                Username
              </span>
              <span className="flex h-[52px] items-center overflow-hidden rounded-[20px] border border-paw-peach/55 bg-white/70 shadow-[0_10px_22px_rgba(122,81,63,0.06)]">
                <span className="grid h-full w-14 shrink-0 place-items-center bg-paw-blush/30 text-paw-pink">
                  <AtSign size={24} />
                </span>
                <input className="min-w-0 flex-1 bg-transparent px-4 text-lg font-black text-paw-ink outline-none" value={username} onChange={(event) => setUsername(event.target.value)} required />
                <Heart className="mr-4 h-4 w-4 fill-paw-blush text-paw-blush" />
              </span>
            </label>
            <label className="mb-3 block">
              <span className="mb-1.5 flex items-center gap-2 text-sm font-black text-paw-cocoa/75">
                <span className="h-2 w-2 rounded-full bg-paw-rose" />
                City
              </span>
              <span className="flex h-[52px] items-center overflow-hidden rounded-[20px] border border-paw-peach/55 bg-white/70 shadow-[0_10px_22px_rgba(122,81,63,0.06)]">
                <span className="grid h-full w-14 shrink-0 place-items-center bg-paw-blush/30 text-paw-pink">
                  <MapPin size={25} className="fill-paw-pink/20" />
                </span>
                <input className="min-w-0 flex-1 bg-transparent px-4 text-lg font-black text-paw-ink outline-none" value={city} onChange={(event) => setCity(event.target.value)} />
                <Heart className="mr-4 h-4 w-4 fill-paw-blush text-paw-blush" />
              </span>
            </label>
            <label className="mb-4 block">
              <span className="mb-1.5 flex items-center gap-2 text-sm font-black text-paw-cocoa/75">
                <span className="h-2 w-2 rounded-full bg-paw-rose" />
                Bio
              </span>
              <span className="flex min-h-[104px] items-stretch overflow-hidden rounded-[20px] border border-paw-peach/55 bg-white/70 shadow-[0_10px_22px_rgba(122,81,63,0.06)]">
                <span className="flex w-14 shrink-0 justify-center bg-paw-blush/30 pt-5 text-paw-pink">
                  <MessageCircle size={25} className="fill-paw-pink/20" />
                </span>
                <textarea className="min-h-[104px] min-w-0 flex-1 resize-none bg-transparent px-4 py-4 text-lg font-black leading-snug text-paw-ink outline-none" value={bio} onChange={(event) => setBio(event.target.value)} maxLength={300} />
                <Heart className="mb-4 mr-4 mt-auto h-4 w-4 shrink-0 fill-paw-blush text-paw-blush" />
              </span>
            </label>
            <button type="submit" disabled={isSaving} className="relative h-14 w-full overflow-hidden rounded-[22px] bg-gradient-to-r from-paw-pink to-paw-rose text-xl font-black text-white shadow-[0_16px_32px_rgba(247,101,137,0.32)] disabled:opacity-70">
              <Sparkles className="absolute left-7 top-4 h-5 w-5 fill-white/30 text-white/30" />
              <span className="inline-flex items-center gap-3">
                <PawPrint className="h-7 w-7 fill-white/25" />
                {isSaving ? "Saving..." : "Save Profile"}
              </span>
              <Sparkles className="absolute right-7 top-4 h-5 w-5 fill-white/30 text-white/30" />
            </button>
          </form>
        </div>
      ) : null}

      {activeStory ? (
        <div className="fixed inset-0 z-[70] bg-paw-ink/95 text-white">
          <div className="mx-auto flex h-full max-w-[430px] flex-col px-4 pb-5 pt-4">
            <div className="mb-4 flex gap-1">
              {stories.map((story, index) => (
                <span key={story.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
                  <span className={`block h-full rounded-full bg-white transition-all duration-300 ${activeStoryIndex !== null && index <= activeStoryIndex ? "w-full" : "w-0"}`} />
                </span>
              ))}
            </div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <img src={avatar} alt={displayName} className="h-10 w-10 rounded-full object-cover ring-2 ring-white" />
                <div className="min-w-0 text-left">
                  <p className="truncate text-sm font-black">{displayName}</p>
                  <p className="text-xs font-bold text-white/65">{new Date(activeStory.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveStoryIndex(null)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/12 text-white"
                aria-label="Close story"
              >
                <X size={22} />
              </button>
            </div>
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-[28px] bg-black shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
              {activeStory.type === "VIDEO" ? (
                <video src={activeStory.url} className="h-full w-full object-contain" controls autoPlay />
              ) : (
                <img src={activeStory.url} alt={activeStory.caption || "Story"} className="h-full w-full object-contain" />
              )}
              <button type="button" onClick={showPreviousStory} className="absolute inset-y-0 left-0 w-1/2" aria-label="Previous story" />
              <button type="button" onClick={showNextStory} className="absolute inset-y-0 right-0 w-1/2" aria-label="Next story" />
              {activeStory.caption ? (
                <p className="absolute inset-x-4 bottom-4 rounded-2xl bg-black/45 px-4 py-3 text-center text-sm font-bold leading-relaxed backdrop-blur-sm">
                  {activeStory.caption}
                </p>
              ) : null}
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
              <button
                type="button"
                onClick={() => void openStoryViewers(activeStory)}
                className="rounded-xl px-2 py-1 text-left text-sm font-black text-white transition hover:bg-white/10"
              >
                {activeStory._count?.views ?? 0} {(activeStory._count?.views ?? 0) === 1 ? "view" : "views"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveStoryIndex(null);
                  setShowAddStory(true);
                }}
                className="inline-flex h-11 items-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-paw-cocoa shadow-soft"
              >
                <Camera size={18} className="text-paw-pink" />
                Add Story
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showAddStory ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-paw-ink/35 px-5 backdrop-blur-sm">
          <form onSubmit={postStory} className="w-full max-w-[380px] rounded-[28px] border border-white/80 bg-[#fff8ef] p-6 shadow-paw">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[34px] font-black leading-none text-paw-ink">Add Story</h2>
                <p className="mt-3 text-lg font-bold leading-none text-paw-cocoa/80">Share a moment with your friends</p>
              </div>
              <button type="button" onClick={closeAddStory} className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white/90 text-paw-ink shadow-soft" aria-label="Close add story">
                <X size={30} strokeWidth={3} />
              </button>
            </div>
            <label className="mb-5 grid min-h-[230px] cursor-pointer place-items-center overflow-hidden rounded-[28px] border-[2px] border-dashed border-paw-rose/65 bg-[#fffaf5] p-5 text-center shadow-[0_12px_34px_rgba(122,81,63,0.08)]">
              {storyPreview ? (
                <img src={storyPreview} alt="" className="h-full max-h-[240px] w-full rounded-[22px] object-cover" />
              ) : (
                <span className="grid place-items-center">
                  <span className="relative mb-5 grid h-24 w-24 place-items-center rounded-full bg-paw-blush text-paw-pink shadow-soft">
                    <ImageIcon size={48} strokeWidth={2.5} />
                    <span className="absolute right-1 top-2 grid h-11 w-11 place-items-center rounded-full bg-paw-pink text-white ring-[5px] ring-white">
                      <Plus size={27} strokeWidth={3} />
                    </span>
                  </span>
                  <span className="text-[22px] font-black leading-tight text-paw-ink">Choose story photo</span>
                  <span className="mt-3 text-base font-bold text-paw-cocoa/72">Add a photo or video to share</span>
                  <span className="mt-5 inline-flex h-12 items-center gap-3 rounded-full bg-white px-6 text-base font-black text-paw-pink shadow-soft">
                    <ImagePlus size={23} />
                    Select from gallery
                  </span>
                </span>
              )}
              <input type="file" accept="image/*" onChange={(event) => chooseStoryFile(event.target.files?.[0])} className="hidden" />
            </label>
            <label className="mb-4 block text-base font-black text-paw-cocoa">
              Write a caption
              <textarea
                value={storyCaption}
                onChange={(event) => setStoryCaption(event.target.value)}
                maxLength={200}
                className="mt-2 min-h-[92px] w-full resize-none rounded-[22px] border border-paw-cocoa/12 bg-white px-5 py-4 text-base font-bold text-paw-ink outline-none"
                placeholder="What's on your mind?"
              />
            </label>
            <button type="submit" disabled={isPostingStory} className="mt-2 h-16 w-full rounded-[22px] bg-gradient-to-r from-paw-rose to-paw-pink text-xl font-black text-white shadow-soft disabled:opacity-70">
              {isPostingStory ? "Posting..." : "Post Story"}
              <Sparkles className="ml-3 inline h-6 w-6 fill-white text-white" />
            </button>
          </form>
        </div>
      ) : null}

      {showStoryViewers ? (
        <div className="fixed inset-0 z-[90] grid place-items-end bg-paw-ink/35 px-4 pb-5 backdrop-blur-sm">
          <div className="w-full max-w-[390px] rounded-[28px] border border-paw-peach/70 bg-[#fff8ef] p-5 text-paw-ink shadow-paw">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">Story viewers</h2>
                <p className="mt-1 text-xs font-bold text-paw-cocoa/70">Your own account is not shown here.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowStoryViewers(false)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-paw-cocoa shadow-soft"
                aria-label="Close viewers"
              >
                <X size={20} />
              </button>
            </div>
            {isLoadingStoryViewers ? (
              <p className="rounded-2xl bg-white/80 px-4 py-5 text-center text-sm font-black text-paw-cocoa">Loading viewers...</p>
            ) : storyViewers.length ? (
              <div className="max-h-[300px] space-y-3 overflow-y-auto pr-1">
                {storyViewers.map((viewer) => (
                  <button
                    key={viewer.id}
                    type="button"
                    onClick={() => {
                      setShowStoryViewers(false);
                      setActiveStoryIndex(null);
                      router.push(`/users/${viewer.id}`);
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl bg-white/80 p-3 text-left shadow-[0_8px_18px_rgba(122,81,63,0.06)] transition hover:bg-white"
                  >
                    <img src={viewer.avatarUrl || profileIcon.src} alt={viewer.username} className="h-12 w-12 rounded-full object-cover" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-paw-ink">{viewer.name}</span>
                      <span className="block truncate text-xs font-bold text-paw-cocoa/70">@{viewer.username}</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl bg-white/80 px-4 py-5 text-center text-sm font-black text-paw-cocoa">No viewers yet.</p>
            )}
          </div>
        </div>
      ) : null}

      {activePanel ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-paw-ink/35 px-5 backdrop-blur-sm">
          <div className="relative w-full max-w-[390px] overflow-hidden rounded-[34px] border-2 border-paw-peach/70 bg-[#fff8ee]/95 px-6 py-7 shadow-[0_24px_70px_rgba(58,34,26,0.28)]">
          <PawPrint className="pointer-events-none absolute bottom-7 left-5 h-12 w-12 rotate-[-12deg] fill-paw-peach/20 text-paw-peach/20" />
          <PawPrint className="pointer-events-none absolute right-7 top-[118px] h-12 w-12 rotate-12 fill-paw-peach/20 text-paw-peach/20" />
          <div className="mb-8 flex items-center justify-between gap-4">
            <h2 className="flex min-w-0 items-center gap-3 text-[31px] font-black leading-tight text-paw-cocoa">
              <span className="truncate">{activePanelTitle}</span>
              <PawPrint className="h-9 w-9 shrink-0 fill-paw-pink/55 text-paw-pink" />
              <Sparkles className="h-6 w-6 shrink-0 fill-paw-butter text-paw-butter" />
            </h2>
            <button
              type="button"
              onClick={() => setActivePanel(null)}
              className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white/80 text-paw-rose shadow-[0_10px_24px_rgba(122,81,63,0.12)]"
              aria-label="Close panel"
            >
              <X size={30} strokeWidth={3} />
            </button>
          </div>

          {activePanel === "posts" ? (
            <div className="relative">
              {profilePosts.length ? (
                <div className="grid max-h-[52vh] gap-3 overflow-y-auto pb-2">
                  {profilePosts.map((post) => (
                    <div
                      key={post.id}
                      className="flex items-center gap-3 rounded-2xl border border-paw-peach/40 bg-white/75 px-4 py-3 text-left shadow-[0_10px_22px_rgba(122,81,63,0.07)]"
                    >
                      <button type="button" onClick={() => router.push(`/community?postId=${post.id}`)} className="min-w-0 flex-1 text-left">
                        <p className="line-clamp-2 text-sm font-extrabold text-paw-ink">{post.text}</p>
                        <p className="mt-2 text-xs font-bold text-paw-cocoa/65">
                          {post._count?.likes ?? 0} likes - {post._count?.comments ?? 0} comments
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleProfilePostSave(post.id)}
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-paw-lavender"
                        aria-label={post.savedByMe ? "Remove saved post" : "Save post"}
                      >
                        <Bookmark size={20} className={post.savedByMe ? "fill-paw-lavender" : ""} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="relative flex min-h-[260px] items-center gap-5 rounded-[28px] border-2 border-dashed border-paw-peach/70 bg-white/50 px-5 py-8">
                  <div className="relative grid h-36 w-36 shrink-0 place-items-center">
                    <div className="absolute inset-0 rounded-full bg-paw-blush/70" />
                    <img
                      src={homepageImage.src}
                      alt=""
                      className="relative h-32 w-32 object-contain drop-shadow-[0_10px_14px_rgba(122,81,63,0.12)]"
                    />
                  </div>
                  <div className="min-w-0 text-left">
                    <h3 className="text-[25px] font-black leading-tight text-paw-cocoa">No posts yet.</h3>
                    <p className="mt-3 text-[18px] font-bold leading-snug text-paw-cocoa/70">
                      Share something pawsome! <Heart className="inline h-5 w-5 fill-paw-rose text-paw-rose" />
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {activePanel === "followers" || activePanel === "following" ? (
            <div className="relative rounded-[28px] border-2 border-dashed border-paw-peach/70 bg-white/50 p-4">
              {(activePanel === "followers" ? followers : following).length ? (
                <div className="grid max-h-[52vh] gap-3 overflow-y-auto">
                  {(activePanel === "followers" ? followers : following).map((person) => (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => router.push(`/users/${person.id}`)}
                      className="flex min-h-20 items-center gap-4 rounded-2xl bg-white/76 px-4 py-3 text-left shadow-[0_10px_22px_rgba(122,81,63,0.07)]"
                    >
                      <img src={person.avatarUrl ?? currentUser.catAvatar} alt={person.name} className="h-14 w-14 rounded-full object-cover ring-4 ring-white" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-lg font-black text-paw-cocoa">{person.name}</span>
                        <span className="mt-1 block truncate text-sm font-bold text-paw-cocoa/65">@{person.username}</span>
                      </span>
                      <ChevronRight size={24} className="shrink-0 text-paw-pink" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[230px] items-center gap-5 px-2">
                  <div className="relative grid h-32 w-32 shrink-0 place-items-center">
                    <div className="absolute inset-0 rounded-full bg-paw-blush/70" />
                    <img src={homepageImage.src} alt="" className="relative h-28 w-28 object-contain drop-shadow-[0_10px_14px_rgba(122,81,63,0.12)]" />
                  </div>
                  <div className="min-w-0 text-left">
                    <h3 className="text-[24px] font-black leading-tight text-paw-cocoa">
                      {activePanel === "followers" ? "No PawPals yet." : "No following yet."}
                    </h3>
                    <p className="mt-3 text-[17px] font-bold leading-snug text-paw-cocoa/70">
                      {activePanel === "followers" ? "New friends will show up here." : "Find PawPals to follow."}{" "}
                      <Heart className="inline h-5 w-5 fill-paw-rose text-paw-rose" />
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {activePanel === "saved" ? (
            <div className="grid gap-4 rounded-[28px] border-2 border-dashed border-paw-peach/70 bg-white/50 p-5">
              <button type="button" onClick={() => router.push("/community?mode=saved")} className="inline-flex h-16 items-center justify-center gap-3 rounded-[24px] bg-white/80 text-lg font-black text-paw-cocoa shadow-[0_10px_22px_rgba(122,81,63,0.07)]">
                <Bookmark size={24} className="fill-paw-pink/20 text-paw-pink" />
                View Saved Posts
              </button>
              <button type="button" onClick={() => router.push("/events?mode=saved")} className="inline-flex h-16 items-center justify-center gap-3 rounded-[24px] bg-white/80 text-lg font-black text-paw-cocoa shadow-[0_10px_22px_rgba(122,81,63,0.07)]">
                <CalendarCheck size={24} className="text-paw-pink" />
                View Saved Events
              </button>
            </div>
          ) : null}

          {activePanel === "notifications" ? (
            <div className="grid max-h-[52vh] gap-3 overflow-y-auto rounded-[28px] border-2 border-dashed border-paw-peach/70 bg-white/50 p-4">
              {isLoadingFollowRequests ? (
                <p className="rounded-2xl bg-white/76 px-4 py-3 text-base font-bold text-paw-cocoa shadow-[0_10px_22px_rgba(122,81,63,0.07)]">
                  Loading requests...
                </p>
              ) : null}
              {followRequests.map((request) => (
                <div key={request.id} className="rounded-2xl bg-white/76 px-4 py-3 shadow-[0_10px_22px_rgba(122,81,63,0.07)]">
                  <div className="flex items-center gap-3">
                    <img
                      src={request.requester.avatarUrl ?? currentUser.catAvatar}
                      alt={request.requester.username}
                      className="h-12 w-12 rounded-full object-cover ring-4 ring-white"
                    />
                    <div className="min-w-0 flex-1 text-left">
                      <p className="truncate text-base font-black text-paw-cocoa">{request.requester.name}</p>
                      <p className="truncate text-sm font-bold text-paw-cocoa/65">@{request.requester.username}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => answerFollowRequest(request.id, "approve")}
                      className="h-10 rounded-[18px] bg-paw-pink text-sm font-black text-white shadow-soft"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => answerFollowRequest(request.id, "reject")}
                      className="h-10 rounded-[18px] bg-white text-sm font-black text-paw-cocoa shadow-soft"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
              {["New tips are available today.", "Remember to refresh your cat's water.", "Check nearby events this week."].map((item) => (
                <p key={item} className="flex min-h-16 items-center gap-3 rounded-2xl bg-white/76 px-4 py-3 text-base font-bold text-paw-cocoa shadow-[0_10px_22px_rgba(122,81,63,0.07)]">
                  <Bell size={22} className="shrink-0 text-paw-pink" />
                  {item}
                </p>
              ))}
            </div>
          ) : null}

          {activePanel === "settings" ? (
            <div className="grid gap-4 rounded-[28px] border-2 border-dashed border-paw-peach/70 bg-white/50 p-5">
              <button type="button" onClick={togglePrivateAccount} className="flex min-h-16 items-center gap-3 rounded-[24px] bg-white/80 px-4 text-left text-paw-cocoa shadow-[0_10px_22px_rgba(122,81,63,0.07)]">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-paw-blush text-paw-pink">
                  <Lock size={21} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-black">Private Account</span>
                  <span className="mt-1 block text-xs font-bold leading-snug text-paw-cocoa/65">
                    Hide posts, followers, following, and chat access from others.
                  </span>
                </span>
                <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${isPrivate ? "bg-paw-pink" : "bg-paw-cocoa/20"}`}>
                  <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${isPrivate ? "left-6" : "left-1"}`} />
                </span>
              </button>
              <button type="button" onClick={openEditProfile} className="inline-flex h-14 items-center justify-center gap-3 rounded-[22px] bg-white/80 text-base font-black text-paw-cocoa shadow-[0_10px_22px_rgba(122,81,63,0.07)]">
                <Edit3 size={21} className="text-paw-pink" />
                Edit Profile
              </button>
              <button type="button" onClick={() => router.push("/auth?mode=login")} className="inline-flex h-14 items-center justify-center gap-3 rounded-[22px] bg-white/80 text-base font-black text-paw-cocoa shadow-[0_10px_22px_rgba(122,81,63,0.07)]">
                <Users size={21} className="text-paw-pink" />
                Switch Account
              </button>
              <button type="button" onClick={logout} className="inline-flex h-14 items-center justify-center gap-2 rounded-[22px] bg-paw-pink text-base font-black text-white shadow-soft">
                <LogOut size={17} />
                Log Out
              </button>
            </div>
          ) : null}
          </div>
        </div>
      ) : null}

      <BottomNav />
    </section>
  );
}
