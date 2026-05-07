"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Globe2, HeartPulse, Image as ImageIcon, PawPrint, Plus, Soup, Star, Tag, Users, X } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { useCurrentUser } from "@/components/CurrentUserProvider";
import { StatusToast } from "@/components/StatusToast";
import { apiFetch, isGuestMode, requireSignedIn, type PublicUser } from "@/lib/api-client";
import bgArtwork from "../../images/bg.png";
import profileIcon from "../../images/profileIcon.png";

type MediaItem = {
  id: string;
  previewUrl: string;
  url?: string;
  file?: File;
  type: "image" | "video";
};

const topics = [
  { label: "Health", value: "HEALTH", icon: HeartPulse, color: "text-paw-pink" },
  { label: "Behavior", value: "BEHAVIOR", icon: PawPrint, color: "text-[#f18727]" },
  { label: "Food", value: "FOOD", icon: Soup, color: "text-[#5bb96a]" },
  { label: "General", value: "GENERAL", icon: Star, color: "text-white" },
  { label: "Memes", value: "MEMES", icon: PawPrint, color: "text-paw-lavender" }
];

export function CreatePostClient() {
  const { currentUser, setCurrentUser } = useCurrentUser();
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [topic, setTopic] = useState("GENERAL");
  const [audience, setAudience] = useState("Public");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [guest, setGuest] = useState(false);
  const [userName, setUserName] = useState(currentUser?.name || "PawPal");
  const [userAvatar, setUserAvatar] = useState(currentUser?.avatarUrl || profileIcon.src);
  const router = useRouter();

  useEffect(() => {
    const isGuest = isGuestMode();
    setGuest(isGuest);
    if (isGuest) {
      setUserName("Guest");
      setUserAvatar(profileIcon.src);
      return;
    }

    apiFetch<{ user: PublicUser }>("/api/auth/me")
      .then(({ user }) => {
        setCurrentUser(user);
        setUserName(user.name || "PawPal");
        setUserAvatar(user.avatarUrl || profileIcon.src);
      })
      .catch(() => {
        setUserAvatar(profileIcon.src);
      });
  }, [setCurrentUser]);

  function openMediaPicker() {
    try {
      requireSignedIn();
      mediaInputRef.current?.click();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Please log in to add media.");
    }
  }

  function addMedia(files: FileList | null) {
    if (!files?.length) return;
    const nextItems = Array.from(files)
      .filter((file) => file.type.startsWith("image/") || file.type.startsWith("video/"))
      .slice(0, Math.max(0, 4 - media.length))
      .map((file) => ({
        id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
        previewUrl: URL.createObjectURL(file),
        file,
        type: file.type.startsWith("video/") ? "video" as const : "image" as const
      }));

    if (!nextItems.length) {
      setStatus("Please choose photos or videos.");
      return;
    }

    setMedia((current) => [...current, ...nextItems].slice(0, 4));
    setStatus("");
  }

  function removeMedia(id: string) {
    setMedia((current) => current.filter((item) => item.id !== id));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setIsSubmitting(true);
    try {
      requireSignedIn();
      const mediaUrls = await Promise.all(
        media.map(async (item) => {
          if (item.url) return item.url;
          if (!item.file) return item.previewUrl;

          const formData = new FormData();
          formData.append("file", item.file);
          formData.append("folder", "posts");
          const upload = await apiFetch<{ url: string }>("/api/uploads", {
            method: "POST",
            body: formData
          });
          return upload.url;
        })
      );

      await apiFetch("/api/posts", {
        method: "POST",
        body: JSON.stringify({ text, topic, mediaUrls })
      });
      router.push("/community");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not create post");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      className="h-screen overflow-hidden px-3 pb-[78px] pt-4"
      style={{
        backgroundImage: `linear-gradient(rgba(255,246,240,0.88), rgba(255,244,239,0.9)), url(${bgArtwork.src})`,
        backgroundPosition: "center top",
        backgroundSize: "cover",
        backgroundAttachment: "fixed"
      }}
    >
      <div className="mx-auto max-w-[430px]">
        <form className="h-[calc(100vh-94px)] overflow-hidden rounded-[28px] bg-white/88 p-4 shadow-paw backdrop-blur" onSubmit={submit}>
          <header className="mb-3 flex items-center justify-between">
            <h1 className="text-[25px] font-black text-paw-ink">
              Create Post <PawPrint size={24} className="inline -translate-y-1 fill-paw-pink/25 text-paw-pink" />
            </h1>
            <Link href="/community" className="grid h-11 w-11 place-items-center rounded-full bg-white text-paw-pink shadow-soft" aria-label="Close">
              <X size={24} />
            </Link>
          </header>

          <div className="mb-4 rounded-[22px] border border-paw-cocoa/15 bg-white/70 p-3">
            <div className="flex gap-3">
              <img
                src={guest ? profileIcon.src : userAvatar}
                alt={guest ? "Guest" : userName}
                className="h-14 w-14 shrink-0 rounded-full object-cover ring-[3px] ring-white shadow-soft"
              />
              <textarea
                className="min-h-[82px] flex-1 resize-none bg-transparent pt-3 text-base font-bold text-paw-ink outline-none placeholder:text-paw-cocoa/55"
                placeholder="What's on your mind?"
                value={text}
                onChange={(event) => setText(event.target.value)}
                required
              />
            </div>
            <div className="flex justify-end text-paw-pink/55">
              <PawPrint size={28} className="fill-paw-pink/10" />
            </div>
          </div>

          <div className="mb-4">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-paw-ink">
              <ImageIcon size={22} className="text-paw-pink" />
              Add Photos or Videos
            </h2>
            <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
              {media.map((item) => (
                <div key={item.id} className="relative h-[72px] w-[72px] shrink-0 overflow-visible">
                  {item.type === "video" ? (
                    <video src={item.previewUrl} className="h-full w-full rounded-[17px] object-cover" muted />
                  ) : (
                    <img src={item.previewUrl} alt="" className="h-full w-full rounded-[17px] object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeMedia(item.id)}
                    className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-white text-paw-pink shadow-soft"
                    aria-label="Remove media"
                  >
                    <X size={17} />
                  </button>
                </div>
              ))}
              {media.length < 4 ? (
                <button
                  className="grid h-[72px] w-[72px] shrink-0 place-items-center rounded-[17px] border-2 border-dashed border-paw-pink/35 bg-white/45 text-paw-pink"
                  type="button"
                  onClick={openMediaPicker}
                  aria-label="Add media"
                >
                  <Plus size={28} />
                </button>
              ) : null}
            </div>
            <input
              ref={mediaInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={(event) => {
                addMedia(event.target.files);
                event.target.value = "";
              }}
            />
            <p className="mt-2 flex items-center gap-2 text-sm font-bold text-paw-cocoa/60">
              <Star size={14} className="fill-[#f5bf4f]/25 text-[#f5bf4f]" />
              You can add up to 4 photos or videos
            </p>
          </div>

          <div className="mb-4">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-paw-ink">
              <Tag size={23} className="text-paw-pink" />
              Add Topic
            </h2>
            <div className="flex flex-wrap gap-2">
              {topics.map((item) => {
                const Icon = item.icon;
                const active = topic === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setTopic(item.value)}
                    className={`inline-flex h-10 min-w-[92px] items-center justify-center gap-2 rounded-2xl px-3 text-sm font-bold shadow-soft ${
                      active ? "bg-paw-lavender text-white" : "bg-white/78 text-paw-cocoa"
                    }`}
                  >
                    <Icon size={18} className={active ? "text-white" : item.color} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between border-t border-paw-cocoa/10 pt-4">
            <span className="inline-flex items-center gap-2 text-lg font-black text-paw-ink">
              <Users size={23} className="text-paw-lavender" />
              Audience
            </span>
            <button
              className="inline-flex h-10 items-center gap-2 rounded-2xl border border-paw-cocoa/15 bg-white/70 px-3 text-sm font-bold text-paw-cocoa"
              type="button"
              onClick={() => {
                try {
                  requireSignedIn();
                  setAudience((current) => (current === "Public" ? "Followers" : "Public"));
                } catch (error) {
                  setStatus(error instanceof Error ? error.message : "Please log in to change audience.");
                }
              }}
            >
              <Globe2 size={18} />
              {audience}
              <ChevronDown size={15} />
            </button>
          </div>

          <StatusToast message={status} onDismiss={() => setStatus("")} />
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-[18px] bg-gradient-to-r from-paw-pink to-paw-rose text-xl font-black text-white shadow-[0_14px_30px_rgba(247,101,137,0.28)] disabled:opacity-70"
          >
            {isSubmitting ? "Posting..." : "Post"}
            <PawPrint size={26} className="fill-white/25" />
          </button>
        </form>
      </div>
      <BottomNav />
    </section>
  );
}
