"use client";

import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Film, ImagePlus, Laugh, PawPrint, Send, Sparkles, X } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { StatusToast } from "@/components/StatusToast";
import { apiFetch, requireSignedIn } from "@/lib/api-client";
import bgArtwork from "../../../images/bg.png";

type MemeMedia = {
  file: File;
  previewUrl: string;
  type: "image" | "video";
};

export default function UploadMemePage() {
  const router = useRouter();
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [media, setMedia] = useState<MemeMedia | null>(null);
  const [caption, setCaption] = useState("");
  const [status, setStatus] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  function chooseMedia(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (media?.previewUrl.startsWith("blob:")) URL.revokeObjectURL(media.previewUrl);
    event.target.value = "";

    if (!file) return;
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      setStatus("Choose an image or video for your meme.");
      return;
    }

    setMedia({
      file,
      previewUrl: URL.createObjectURL(file),
      type: file.type.startsWith("video/") ? "video" : "image"
    });
    setStatus("");
  }

  function removeMedia() {
    if (media?.previewUrl.startsWith("blob:")) URL.revokeObjectURL(media.previewUrl);
    setMedia(null);
  }

  async function publishMeme(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    if (!media) {
      setStatus("Add an image or video first.");
      return;
    }
    if (!caption.trim()) {
      setStatus("Add meme text before posting.");
      return;
    }

    setIsPublishing(true);
    try {
      requireSignedIn();
      const formData = new FormData();
      formData.append("file", media.file);
      formData.append("folder", "memes");
      const upload = await apiFetch<{ url: string }>("/api/uploads", {
        method: "POST",
        body: formData
      });

      await apiFetch("/api/posts", {
        method: "POST",
        body: JSON.stringify({
          text: caption.trim(),
          topic: "MEMES",
          mediaUrls: [upload.url]
        })
      });

      router.push("/stories");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not publish meme.");
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <section
      className="min-h-screen px-4 pb-28 pt-5"
      style={{
        backgroundImage: `linear-gradient(rgba(255,246,240,0.9), rgba(255,244,239,0.92)), url(${bgArtwork.src})`,
        backgroundPosition: "center top",
        backgroundSize: "cover",
        backgroundAttachment: "fixed"
      }}
    >
      <div className="mx-auto max-w-[430px]">
        <form onSubmit={publishMeme} className="overflow-hidden rounded-[30px] border-2 border-paw-pink/20 bg-[#fff8ef]/95 p-5 shadow-paw">
          <header className="mb-5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="flex items-center gap-2 text-[29px] font-black leading-tight text-paw-ink">
                Upload Meme
                <Laugh className="h-7 w-7 text-paw-pink" />
              </h1>
              <p className="mt-1 text-sm font-bold text-paw-cocoa/70">Make it funny, cute, and instantly shareable.</p>
            </div>
            <Link href="/stories" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-paw-cocoa shadow-soft" aria-label="Close upload meme">
              <X size={24} />
            </Link>
          </header>

          <div className="mb-5 rounded-[26px] bg-gradient-to-br from-paw-blush via-white to-[#fff0c9] p-3 shadow-[0_14px_30px_rgba(247,101,137,0.12)]">
            <button
              type="button"
              onClick={() => mediaInputRef.current?.click()}
              className="grid min-h-[260px] w-full place-items-center overflow-hidden rounded-[22px] border-2 border-dashed border-paw-pink/45 bg-white/70 text-center"
            >
              {media ? (
                media.type === "video" ? (
                  <video src={media.previewUrl} className="h-full max-h-[320px] w-full object-cover" muted controls />
                ) : (
                  <img src={media.previewUrl} alt="Meme preview" className="h-full max-h-[320px] w-full object-cover" />
                )
              ) : (
                <span className="grid place-items-center px-6">
                  <span className="relative mb-5 grid h-24 w-24 place-items-center rounded-full bg-paw-pink text-white shadow-soft">
                    <ImagePlus size={42} />
                    <Sparkles className="absolute -right-5 top-7 h-5 w-5 fill-paw-butter text-paw-butter" />
                  </span>
                  <span className="text-xl font-black text-paw-ink">Choose meme media</span>
                  <span className="mt-2 text-sm font-bold text-paw-cocoa/65">Upload one image or video.</span>
                </span>
              )}
            </button>
            <input ref={mediaInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={chooseMedia} />
            {media ? (
              <div className="mt-3 flex gap-3">
                <button type="button" onClick={() => mediaInputRef.current?.click()} className="h-11 flex-1 rounded-2xl bg-white text-sm font-black text-paw-cocoa shadow-soft">
                  Replace
                </button>
                <button type="button" onClick={removeMedia} className="h-11 flex-1 rounded-2xl bg-paw-blush text-sm font-black text-paw-pink shadow-soft">
                  Remove
                </button>
              </div>
            ) : null}
          </div>

          <label className="mb-5 block">
            <span className="mb-2 flex items-center gap-2 text-sm font-black text-paw-cocoa">
              <PawPrint className="h-4 w-4 fill-paw-pink/30 text-paw-pink" />
              Caption or meme text
            </span>
            <textarea
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              maxLength={220}
              className="min-h-[110px] w-full resize-none rounded-[22px] border border-paw-pink/20 bg-white px-5 py-4 text-base font-black text-paw-ink outline-none focus:border-paw-pink/60"
              placeholder="I do not need therapy. I need treats."
            />
            <span className="mt-2 block text-right text-xs font-black text-paw-pink">{caption.length}/220</span>
          </label>

          <div className="mb-5 rounded-[24px] bg-white/72 p-4 shadow-[0_10px_22px_rgba(122,81,63,0.07)]">
            <h2 className="mb-3 flex items-center gap-2 text-base font-black text-paw-ink">
              <Film size={19} className="text-paw-pink" />
              Preview
            </h2>
            <div className="overflow-hidden rounded-[22px] border-2 border-paw-pink/15 bg-[#fff5f8]">
              {media ? (
                media.type === "video" ? (
                  <video src={media.previewUrl} className="h-44 w-full object-cover" muted controls />
                ) : (
                  <img src={media.previewUrl} alt="Meme preview" className="h-44 w-full object-cover" />
                )
              ) : (
                <div className="grid h-44 place-items-center text-sm font-black text-paw-cocoa/60">Media preview appears here</div>
              )}
              <p className="min-h-14 px-4 py-3 text-base font-black leading-snug text-paw-ink">
                {caption.trim() || "Your meme text will appear here."}
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPublishing}
            className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-[22px] bg-gradient-to-r from-paw-pink to-paw-rose text-lg font-black text-white shadow-[0_14px_30px_rgba(247,101,137,0.25)] disabled:opacity-70"
          >
            <Send size={20} />
            {isPublishing ? "Publishing..." : "Publish Meme"}
          </button>
        </form>
      </div>
      <StatusToast message={status} onDismiss={() => setStatus("")} />
      <BottomNav />
    </section>
  );
}
