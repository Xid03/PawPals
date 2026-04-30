"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera, CirclePlus, Image, PawPrint } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { CatMascot } from "@/components/CatMascot";
import { apiFetch, type ApiConversation, type ApiMessage } from "@/lib/api-client";
import { chatMessages } from "@/data/mockData";

export function ChatClient() {
  const [conversation, setConversation] = useState<ApiConversation | null>(null);
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");
  const [showAttachments, setShowAttachments] = useState(false);

  useEffect(() => {
    apiFetch<ApiConversation[]>("/api/conversations?limit=1")
      .then(async (items) => {
        if (!items.length) {
          setStatus("No API conversations yet. Create one from Postman or after a match.");
          return;
        }
        setConversation(items[0]);
        const data = await apiFetch<ApiMessage[]>(`/api/conversations/${items[0].id}/messages`);
        setMessages(data);
      })
      .catch((error) => setStatus(error instanceof Error ? error.message : "Using mock chat"));
  }, []);

  const displayMessages = useMemo(() => {
    if (messages.length) {
      return messages.map((message) => ({
        id: message.id,
        from: message.senderId === messages[0]?.senderId ? "them" : "me",
        text: message.body,
        time: new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }));
    }
    return chatMessages;
  }, [messages]);

  async function sendMessage() {
    if (!conversation || !body.trim()) return;
    try {
      const data = await apiFetch<{ message: ApiMessage }>(`/api/conversations/${conversation.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ body, type: "TEXT" })
      });
      setMessages((current) => [...current, data.message]);
      setBody("");
      setStatus("Message sent");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not send message");
    }
  }

  return (
    <section className="flex min-h-screen flex-col bg-paw-radial pb-28">
      <PageHeader title="Luna's Mom" subtitle={conversation ? "API conversation" : "Mock preview"} backHref="/discover" action="bell" />
      {status ? <p className="px-5 pb-3 text-xs font-extrabold text-paw-cocoa/70">{status}</p> : null}
      <div className="flex-1 space-y-4 px-5">
        {displayMessages.map((message) => (
          <div key={message.id} className={`flex ${message.from === "me" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[74%] rounded-3xl px-4 py-3 ${message.from === "me" ? "bg-[#E8F4FF]" : "bg-white/75"}`}>
              <p className="text-sm font-bold leading-relaxed">{message.text}</p>
              <p className="mt-1 text-right text-[10px] font-bold text-paw-cocoa/55">{message.time}</p>
            </div>
          </div>
        ))}
        <CatMascot compact />
      </div>
      <div className="fixed bottom-[76px] left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 bg-paw-cream/80 px-4 py-3 backdrop-blur md:bottom-[100px]">
        <div className="flex items-center gap-2">
          <button
            className="grid h-11 w-11 place-items-center rounded-full bg-white/70"
            type="button"
            onClick={() => setShowAttachments((current) => !current)}
            aria-label="Show attachment options"
          >
            <CirclePlus size={20} />
          </button>
          <label className="paw-input flex h-11 flex-1 items-center rounded-2xl px-4">
            <input
              placeholder="Type a message..."
              className="w-full bg-transparent text-sm font-bold outline-none"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void sendMessage();
              }}
            />
          </label>
          <button className="grid h-11 w-11 place-items-center rounded-full bg-paw-pink text-white shadow-soft" type="button" onClick={sendMessage}>
            <PawPrint size={20} />
          </button>
        </div>
        {showAttachments ? (
          <div className="mt-2 flex gap-4 pl-14 text-paw-cocoa">
            <button type="button" onClick={() => setStatus("Camera capture can be connected through uploads.")} aria-label="Open camera">
              <Camera size={17} />
            </button>
            <button type="button" onClick={() => setStatus("Image picker can be connected through uploads.")} aria-label="Choose image">
              <Image size={17} />
            </button>
          </div>
        ) : null}
      </div>
      <BottomNav />
    </section>
  );
}
