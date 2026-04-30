"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, Camera, CirclePlus, Image as ImageIcon, PawPrint, X } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { CatMascot } from "@/components/CatMascot";
import { apiFetch, getToken, isGuestMode, requireSignedIn, type ApiConversation, type ApiMessage, type PublicUser } from "@/lib/api-client";
import { cats, chatMessages } from "@/data/mockData";
import loginIcon from "../../images/loginIcon.png";

type DisplayMessage = {
  id: string;
  from: "me" | "them";
  text: string;
  time: string;
  imageUrl?: string;
};

type ChatThread = {
  id: string;
  name: string;
  subtitle: string;
  avatar: string;
  lastMessage: string;
  time: string;
  source: "api" | "preview";
  conversation?: ApiConversation;
};

function currentTimeLabel() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const lunaPreviewMessages: DisplayMessage[] = chatMessages.map((message) => ({
  ...message,
  from: message.from === "me" ? "me" : "them"
}));

const previewThreads: ChatThread[] = [
  {
    id: "preview-luna",
    name: "Luna's Mom",
    subtitle: "Cat playdate friend",
    avatar: cats[0].image,
    lastMessage: "Yes! That would be purrfect.",
    time: "10:35 AM",
    source: "preview"
  },
  {
    id: "preview-milo",
    name: "Milo's Dad",
    subtitle: "British Shorthair owner",
    avatar: cats[1].image,
    lastMessage: "Milo would love a weekend meetup.",
    time: "Yesterday",
    source: "preview"
  },
  {
    id: "preview-simba",
    name: "Simba's Family",
    subtitle: "Nearby PawPal",
    avatar: cats[2].image,
    lastMessage: "Image attachment",
    time: "Mon",
    source: "preview"
  }
];

const previewMessagesByThread: Record<string, DisplayMessage[]> = {
  "preview-luna": lunaPreviewMessages,
  "preview-milo": [
    { id: "milo-1", from: "them", text: "Hi! Milo keeps watching your cat profile.", time: "4:18 PM" },
    { id: "milo-2", from: "me", text: "That is adorable. Luna likes calm cats.", time: "4:20 PM" },
    { id: "milo-3", from: "them", text: "Milo would love a weekend meetup.", time: "4:24 PM" }
  ],
  "preview-simba": [
    { id: "simba-1", from: "them", text: "Simba found his favorite sunny spot today.", time: "8:10 AM" },
    { id: "simba-2", from: "them", text: "Simba photo", time: "8:11 AM", imageUrl: cats[2].image },
    { id: "simba-3", from: "me", text: "He looks so happy there.", time: "8:13 AM" }
  ]
};

function decodeCurrentUserId() {
  const token = getToken();
  if (!token) return null;

  try {
    const [, payload] = token.split(".");
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = JSON.parse(window.atob(padded)) as { sub?: string };
    return decoded.sub ?? null;
  } catch {
    return null;
  }
}

function formatMessageTime(createdAt?: string) {
  if (!createdAt) return "";
  return new Date(createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fallbackAvatar(user?: PublicUser) {
  return user?.avatarUrl || cats[0].image;
}

export function ChatClient() {
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [guestLocked, setGuestLocked] = useState<boolean | null>(null);
  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [conversation, setConversation] = useState<ApiConversation | null>(null);
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [localMessagesByThread, setLocalMessagesByThread] = useState<Record<string, DisplayMessage[]>>(previewMessagesByThread);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");
  const [showAttachments, setShowAttachments] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const locked = isGuestMode();
    setGuestLocked(locked);
    if (locked) return;

    apiFetch<ApiConversation[]>("/api/conversations?limit=20")
      .then((items) => setConversations(items))
      .catch(() => setStatus(""));
  }, []);

  const threads = useMemo(() => {
    const currentUserId = decodeCurrentUserId();
    const apiThreads = conversations.map((item) => {
      const otherParticipant =
        item.participants.find((participant) => participant.user.id !== currentUserId)?.user ?? item.participants[0]?.user;
      const latestMessage = item.messages?.[0];
      return {
        id: item.id,
        name: otherParticipant?.name ?? "PawPal",
        subtitle: otherParticipant?.username ? `@${otherParticipant.username}` : "Conversation",
        avatar: fallbackAvatar(otherParticipant),
        lastMessage: latestMessage?.type === "IMAGE" ? "Image attachment" : latestMessage?.body ?? "Start chatting",
        time: latestMessage ? formatMessageTime(latestMessage.createdAt) : "",
        source: "api" as const,
        conversation: item
      };
    });

    return apiThreads.length ? apiThreads : previewThreads;
  }, [conversations]);

  const displayMessages = useMemo(() => {
    if (!selectedThread) return [];

    if (selectedThread.source === "api") {
      const currentUserId = decodeCurrentUserId();
      return messages.map((message) => ({
        id: message.id,
        from: message.senderId === currentUserId ? "me" : "them",
        text: message.body,
        time: new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        imageUrl: message.type === "IMAGE" ? message.body : undefined
      }));
    }

    return localMessagesByThread[selectedThread.id] ?? [];
  }, [localMessagesByThread, messages, selectedThread]);

  function addPreviewMessage(text: string, imageUrl?: string) {
    if (!selectedThread) return;
    const message: DisplayMessage = {
      id: `local-${Date.now()}`,
      from: "me",
      text,
      time: currentTimeLabel(),
      imageUrl
    };
    setLocalMessagesByThread((current) => ({
      ...current,
      [selectedThread.id]: [...(current[selectedThread.id] ?? []), message]
    }));
  }

  async function openThread(thread: ChatThread) {
    setSelectedThread(thread);
    setShowAttachments(false);
    setStatus("");
    setBody("");

    if (thread.source === "api" && thread.conversation) {
      setConversation(thread.conversation);
      try {
        const data = await apiFetch<ApiMessage[]>(`/api/conversations/${thread.conversation.id}/messages`);
        setMessages(data);
      } catch (error) {
        setMessages([]);
        setStatus(error instanceof Error ? error.message : "Could not load messages");
      }
      return;
    }

    setConversation(null);
    setMessages([]);
  }

  function closeThread() {
    setSelectedThread(null);
    setConversation(null);
    setMessages([]);
    setBody("");
    setStatus("");
    setShowAttachments(false);
  }

  async function sendMessage() {
    const trimmedBody = body.trim();
    if (!trimmedBody) return;
    try {
      requireSignedIn();
      if (!conversation) {
        addPreviewMessage(trimmedBody);
        setBody("");
        setStatus("Message added to preview");
        return;
      }
      const data = await apiFetch<{ message: ApiMessage }>(`/api/conversations/${conversation.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ body: trimmedBody, type: "TEXT" })
      });
      setMessages((current) => [...current, data.message]);
      setBody("");
      setStatus("Message sent");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not send message");
    }
  }

  async function attachImage(file: File | null | undefined) {
    if (!file) return;
    try {
      requireSignedIn();
      if (!file.type.startsWith("image/")) {
        setStatus("Please choose an image file.");
        return;
      }

      if (!conversation) {
        addPreviewMessage(file.name, URL.createObjectURL(file));
        setShowAttachments(false);
        setStatus("Image added to preview");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "chat");
      const upload = await apiFetch<{ url: string }>("/api/uploads", {
        method: "POST",
        body: formData
      });
      const data = await apiFetch<{ message: ApiMessage }>(`/api/conversations/${conversation.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ body: upload.url, type: "IMAGE" })
      });
      setMessages((current) => [...current, data.message]);
      setShowAttachments(false);
      setStatus("Image sent");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not attach image");
    }
  }

  function openAttachmentPicker(kind: "camera" | "image") {
    try {
      requireSignedIn();
      if (kind === "camera") {
        cameraInputRef.current?.click();
      } else {
        imageInputRef.current?.click();
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Please log in to send attachments.");
    }
  }

  function openNotifications() {
    try {
      requireSignedIn();
      setShowNotifications(true);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Please log in to view notifications.");
    }
  }

  return (
    <section className="flex min-h-screen flex-col bg-paw-radial pb-28">
      <header className="flex items-center justify-between px-5 pb-4 pt-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/55 text-paw-ink"
            onClick={() => {
              if (selectedThread) {
                closeThread();
                return;
              }
              router.push("/home");
            }}
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-black leading-tight text-paw-ink">{selectedThread?.name ?? "Chats"}</h1>
            <p className="text-xs font-bold text-paw-cocoa/70">
              {guestLocked
                ? "Login to start chatting"
                : selectedThread
                  ? conversation
                    ? "API conversation"
                    : "Mock preview"
                  : "Previous conversations"}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-full bg-white/55 text-paw-ink"
          onClick={openNotifications}
          aria-label="Open chat notifications"
        >
          <Bell size={19} />
        </button>
      </header>
      {status ? <p className="px-5 pb-3 text-xs font-extrabold text-paw-cocoa/70">{status}</p> : null}
      {guestLocked ? (
        <div className="flex flex-1 items-start justify-center px-5 pt-8">
          <div className="w-full rounded-[30px] border border-paw-peach/70 bg-white/80 px-5 py-8 text-center shadow-soft">
            <div className="mx-auto mb-4 grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-paw-blush ring-4 ring-white">
              <img src={loginIcon.src} alt="" className="h-full w-full object-cover" />
            </div>
            <h2 className="text-2xl font-black text-paw-ink">Login Required</h2>
            <p className="mx-auto mt-2 max-w-[260px] text-sm font-extrabold leading-relaxed text-paw-cocoa/70">
              Please log in to view previous chats and message other PawPals.
            </p>
            <button
              type="button"
              className="mt-6 inline-flex h-12 min-w-36 items-center justify-center gap-2 rounded-2xl bg-paw-pink px-6 text-sm font-black text-white shadow-soft"
              onClick={() => router.push("/auth?mode=login")}
            >
              Log In
              <PawPrint size={18} />
            </button>
            <button
              type="button"
              className="mt-3 block w-full text-sm font-black text-paw-cocoa"
              onClick={() => router.push("/auth?mode=signup")}
            >
              Create Account
            </button>
          </div>
        </div>
      ) : guestLocked === null ? (
        <div className="flex flex-1 items-center justify-center px-5 text-sm font-black text-paw-cocoa/70">
          Checking chat access...
        </div>
      ) : !selectedThread ? (
        <div className="flex-1 space-y-3 px-5">
          {threads.map((thread) => (
            <button
              key={thread.id}
              type="button"
              className="flex w-full items-center gap-3 rounded-[26px] bg-white/75 p-3 text-left shadow-soft transition active:scale-[0.99]"
              onClick={() => void openThread(thread)}
            >
              <img src={thread.avatar} alt={thread.name} className="h-14 w-14 rounded-full object-cover ring-4 ring-white" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="truncate text-base font-black text-paw-ink">{thread.name}</h2>
                  <span className="shrink-0 text-[10px] font-black text-paw-cocoa/55">{thread.time}</span>
                </div>
                <p className="truncate text-xs font-bold text-paw-cocoa/65">{thread.subtitle}</p>
                <p className="mt-1 truncate text-sm font-extrabold text-paw-cocoa">{thread.lastMessage}</p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex-1 space-y-4 px-5">
          {displayMessages.map((message) => (
            <div key={message.id} className={`flex ${message.from === "me" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[74%] rounded-3xl px-4 py-3 ${message.from === "me" ? "bg-[#E8F4FF]" : "bg-white/75"}`}>
                {message.imageUrl ? (
                  <img
                    src={message.imageUrl}
                    alt={message.text}
                    className="mb-2 max-h-52 w-full rounded-2xl object-cover"
                  />
                ) : null}
                <p className="text-sm font-bold leading-relaxed">{message.imageUrl ? "Image attachment" : message.text}</p>
                <p className="mt-1 text-right text-[10px] font-bold text-paw-cocoa/55">{message.time}</p>
              </div>
            </div>
          ))}
          <CatMascot compact />
        </div>
      )}
      {selectedThread ? (
        <div className="fixed bottom-[76px] left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 bg-paw-cream/80 px-4 py-3 backdrop-blur md:bottom-[100px]">
          <div className="flex items-center gap-2">
            <button
              className="grid h-11 w-11 place-items-center rounded-full bg-white/70"
              type="button"
              onClick={() => {
                try {
                  requireSignedIn();
                  setShowAttachments((current) => !current);
                } catch (error) {
                  setStatus(error instanceof Error ? error.message : "Please log in to send attachments.");
                }
              }}
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
            <div className="mt-3 flex gap-3 pl-14 text-paw-cocoa">
              <button
                type="button"
                className="flex items-center gap-2 rounded-full bg-white/75 px-3 py-2 text-xs font-black"
                onClick={() => openAttachmentPicker("camera")}
                aria-label="Open camera"
              >
                <Camera size={17} />
                Camera
              </button>
              <button
                type="button"
                className="flex items-center gap-2 rounded-full bg-white/75 px-3 py-2 text-xs font-black"
                onClick={() => openAttachmentPicker("image")}
                aria-label="Choose image"
              >
                <ImageIcon size={17} />
                Photo
              </button>
            </div>
          ) : null}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => {
              void attachImage(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              void attachImage(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </div>
      ) : null}
      {showNotifications ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-paw-ink/25 px-5 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[28px] bg-white p-5 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-paw-ink">Chat Alerts</h2>
                <p className="text-xs font-bold text-paw-cocoa/65">Conversation updates</p>
              </div>
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-full bg-paw-cream text-paw-ink"
                onClick={() => setShowNotifications(false)}
                aria-label="Close notifications"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="rounded-3xl bg-paw-cream p-4">
                <p className="text-sm font-black text-paw-ink">No new messages right now.</p>
                <p className="mt-1 text-xs font-bold text-paw-cocoa/70">
                  New replies, image messages, and playdate updates will appear here.
                </p>
              </div>
              <button
                type="button"
                className="w-full rounded-2xl bg-paw-pink py-3 text-sm font-black text-white shadow-soft"
                onClick={() => setShowNotifications(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <BottomNav />
    </section>
  );
}
