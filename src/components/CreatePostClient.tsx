"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { PrimaryButton } from "@/components/PrimaryButton";
import { TagChip } from "@/components/TagChip";
import { apiFetch, requireSignedIn } from "@/lib/api-client";
import { cats, currentUser } from "@/data/mockData";

const topics = ["Health", "Behavior", "Food", "General", "Memes"];

export function CreatePostClient() {
  const [text, setText] = useState("");
  const [topic, setTopic] = useState("GENERAL");
  const [audience, setAudience] = useState("Public");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setIsSubmitting(true);
    try {
      requireSignedIn();
      await apiFetch("/api/posts", {
        method: "POST",
        body: JSON.stringify({ text, topic, mediaUrls: [] })
      });
      router.push("/community");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not create post");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="min-h-screen bg-paw-radial pb-28 pt-7">
      <header className="mb-6 flex items-center justify-between px-5">
        <h1 className="text-xl font-black">Create Post</h1>
        <a href="/community" className="grid h-10 w-10 place-items-center rounded-full bg-white/60" aria-label="Close">
          <X size={19} />
        </a>
      </header>

      <div className="px-5">
        <form className="paw-card rounded-3xl p-4" onSubmit={submit}>
          <div className="mb-4 flex gap-3">
            <img src={currentUser.avatar} alt={currentUser.name} className="h-11 w-11 rounded-full object-cover" />
            <textarea
              className="min-h-24 flex-1 resize-none bg-transparent pt-2 text-sm font-bold outline-none"
              placeholder="What's on your mind?"
              value={text}
              onChange={(event) => setText(event.target.value)}
              required
            />
          </div>

          <h2 className="mb-3 text-sm font-black">Add Photos or Videos</h2>
          <div className="mb-6 flex gap-3">
            {cats.slice(0, 3).map((cat) => (
              <img key={cat.id} src={cat.image} alt={cat.name} className="h-20 w-20 rounded-2xl object-cover" />
            ))}
            <button
              className="grid h-20 w-20 place-items-center rounded-2xl bg-white/70 text-paw-cocoa"
              type="button"
              onClick={() => {
                try {
                  requireSignedIn();
                  setStatus("Photo upload is handled by /api/uploads. Pickers can be connected next.");
                } catch (error) {
                  setStatus(error instanceof Error ? error.message : "Please log in to add media.");
                }
              }}
              aria-label="Add media"
            >
              <Plus size={26} />
            </button>
          </div>

          <h2 className="mb-3 text-sm font-black">Add Topic</h2>
          <div className="mb-6 flex flex-wrap gap-2">
            {topics.map((item) => {
              const value = item.toUpperCase();
              return (
                <button key={item} type="button" onClick={() => setTopic(value)}>
                  <TagChip active={topic === value}>{item}</TagChip>
                </button>
              );
            })}
          </div>

          <div className="mb-6 flex items-center justify-between border-t border-paw-cocoa/10 pt-4">
            <span className="text-sm font-black">Audience</span>
            <button
              className="text-sm font-extrabold text-paw-cocoa/70"
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
              {audience}
            </button>
          </div>

          {status ? <p className="mb-3 text-xs font-extrabold text-paw-pink">{status}</p> : null}
          <PrimaryButton type="submit">{isSubmitting ? "Posting..." : "Post"}</PrimaryButton>
        </form>
      </div>
      <BottomNav />
    </section>
  );
}
