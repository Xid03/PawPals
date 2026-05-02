"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, Camera, ChevronRight, CirclePlus, Heart, Home, Image as ImageIcon, PawPrint, Search, SlidersHorizontal, Smile, Sparkles, UserRound, X } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { apiFetch, getToken, isGuestMode, requireSignedIn, type ApiConversation, type ApiMessage, type PublicUser } from "@/lib/api-client";
import { cats, chatMessages } from "@/data/mockData";
import bgChat from "../../images/bgChat.png";
import homepageImage from "../../images/homepage.png";
import loginIcon from "../../images/loginIcon.png";
import profile1 from "../../images/profile1.png";

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

function threadTone(index: number) {
  const tones = [
    { paw: "text-paw-pink", pill: "bg-paw-blush text-paw-cocoa", dot: "bg-[#50d66e]", unread: "2", Icon: PawPrint },
    { paw: "text-[#93a4ff]", pill: "bg-[#efe8ff] text-paw-cocoa", dot: "bg-[#50d66e]", unread: "", Icon: Home },
    { paw: "text-[#ff873f]", pill: "bg-[#ffefe4] text-paw-cocoa", dot: "bg-[#ffc114]", unread: "", Icon: ImageIcon }
  ];
  return tones[index % tones.length];
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
  const [searchQuery, setSearchQuery] = useState("");
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

  const visibleThreads = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return threads;
    return threads.filter((thread) =>
      [thread.name, thread.subtitle, thread.lastMessage].some((value) => value.toLowerCase().includes(query))
    );
  }, [searchQuery, threads]);

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
    <section
      className="relative flex min-h-screen flex-col overflow-hidden px-5 pb-28 pt-6"
      style={{
        backgroundImage: `linear-gradient(rgba(255,247,238,0.9), rgba(255,241,236,0.92)), url(${bgChat.src})`,
        backgroundPosition: "center top",
        backgroundSize: "cover",
        backgroundAttachment: "fixed"
      }}
    >
      {!selectedThread ? (
        <>
          <PawPrint size={74} className="pointer-events-none absolute right-20 top-20 rotate-12 fill-paw-pink/10 text-paw-pink/10" />
          <Heart size={34} className="pointer-events-none absolute right-16 top-40 fill-paw-pink/15 text-paw-pink/15" />
        </>
      ) : null}

      {selectedThread ? (
        <header className="relative z-10 -mx-5 -mt-6 mb-3 min-h-[190px] overflow-hidden px-5 pt-7">
          <div className="relative z-20 flex items-start justify-between gap-4">
            <button
              type="button"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/88 text-paw-pink shadow-soft"
              onClick={closeThread}
              aria-label="Back to chats"
            >
              <ArrowLeft size={25} strokeWidth={2.8} />
            </button>

            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="relative shrink-0">
                <img src={selectedThread.avatar} alt={selectedThread.name} className="h-16 w-16 rounded-full object-cover ring-[3px] ring-white shadow-soft" />
                <span className="absolute -bottom-1 -right-2 grid h-9 w-9 place-items-center rounded-full bg-white text-paw-pink shadow-soft">
                  <Heart size={20} className="fill-paw-pink/25" />
                </span>
              </span>
              <span className="min-w-0">
                <h1 className="truncate text-[25px] font-black leading-tight text-paw-ink">{selectedThread.name}</h1>
                <p className="truncate text-base font-bold text-paw-cocoa">
                  {selectedThread.subtitle} <PawPrint size={14} className="inline -translate-y-0.5 fill-paw-pink/20 text-paw-pink" />
                </p>
                <p className="mt-0.5 text-sm font-bold text-[#46ae63]">
                  Online <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#46ae63]" />
                </p>
              </span>
            </div>

            <button
              type="button"
              className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/88 text-paw-ink shadow-soft"
              onClick={openNotifications}
              aria-label="Open chat notifications"
            >
              <span className="absolute right-1.5 top-1.5 h-3.5 w-3.5 rounded-full bg-paw-pink ring-2 ring-white" />
              <Bell size={24} strokeWidth={2.4} />
            </button>
          </div>
          <img src={profile1.src} alt="" className="pointer-events-none absolute bottom-0 right-16 z-10 h-24 w-24 object-contain opacity-95" />
          <Heart size={32} className="pointer-events-none absolute bottom-10 right-8 z-10 fill-paw-pink/65 text-paw-pink/65" />
          <div className="absolute bottom-[-52px] left-[-14%] z-0 h-[112px] w-[128%] rotate-[-3deg] rounded-t-[50%] border-t-4 border-paw-blush/70 bg-[#fff8ef]/92" />
        </header>
      ) : (
        <header className="relative z-10 flex items-center justify-between pb-7">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="grid h-[62px] w-[62px] shrink-0 place-items-center rounded-full bg-white/85 text-paw-pink shadow-soft"
              onClick={() => router.push("/home")}
              aria-label="Go back"
            >
              <ArrowLeft size={30} strokeWidth={2.8} />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-[42px] font-black leading-tight text-paw-ink">
                Chats <PawPrint size={34} className="inline -translate-y-1 fill-paw-pink/30 text-paw-pink" />
              </h1>
              <p className="text-lg font-bold text-paw-cocoa/75">
                {guestLocked ? "Login to start chatting" : "Previous conversations"}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="relative grid h-[62px] w-[62px] shrink-0 place-items-center rounded-full bg-white/85 text-paw-ink shadow-soft"
            onClick={openNotifications}
            aria-label="Open chat notifications"
          >
            <span className="absolute right-2 top-2 h-3 w-3 rounded-full bg-paw-pink ring-2 ring-white" />
            <Bell size={28} strokeWidth={2.4} />
          </button>
        </header>
      )}
      {status ? <p className="px-5 pb-3 text-xs font-extrabold text-paw-cocoa/70">{status}</p> : null}
      {guestLocked ? (
        <div className="flex flex-1 items-start justify-center pt-2">
          <div className="relative w-full overflow-hidden rounded-[36px] border-2 border-paw-peach/70 bg-[#fff8ee]/95 px-7 pb-8 pt-7 text-center shadow-[0_18px_50px_rgba(122,81,63,0.16)]">
            <div className="pointer-events-none absolute -left-14 -top-12 h-36 w-52 rounded-[46%] bg-paw-blush/55" />
            <div className="pointer-events-none absolute -bottom-16 -left-12 h-32 w-48 rounded-[48%] bg-paw-blush/45" />
            <div className="pointer-events-none absolute -bottom-16 -right-12 h-32 w-48 rounded-[48%] bg-paw-blush/45" />
            <PawPrint className="pointer-events-none absolute left-8 top-24 h-12 w-12 rotate-[-12deg] fill-paw-peach/20 text-paw-peach/20" />
            <PawPrint className="pointer-events-none absolute right-8 top-44 h-12 w-12 rotate-12 fill-paw-peach/20 text-paw-peach/20" />

            <div className="relative mx-auto mb-5 grid h-32 w-32 place-items-center rounded-full bg-paw-blush shadow-[0_18px_35px_rgba(247,101,137,0.22)]">
              <Sparkles className="absolute -left-9 top-10 h-6 w-6 fill-paw-butter text-paw-butter" />
              <Sparkles className="absolute -right-8 top-16 h-5 w-5 fill-white text-white" />
              <span className="relative grid h-[92px] w-[92px] place-items-center overflow-hidden rounded-full bg-white/75 shadow-[0_10px_18px_rgba(247,101,137,0.2)] ring-4 ring-white/80">
                <img src={loginIcon.src} alt="" className="h-full w-full object-cover" />
              </span>
            </div>

            <h2 className="text-[34px] font-black leading-tight text-paw-cocoa">
              Login <span className="text-paw-pink">Required</span>
            </h2>
            <p className="mx-auto mt-3 max-w-[280px] text-[18px] font-black leading-relaxed text-paw-cocoa/75">
              Please log in to view previous chats and message other PawPals.
            </p>
            <div className="mx-auto mt-4 flex w-16 items-center justify-center gap-2 text-paw-blush">
              <span className="h-1.5 w-1.5 rounded-full bg-paw-blush" />
              <Heart className="h-5 w-5 fill-paw-blush text-paw-blush" />
              <span className="h-1.5 w-1.5 rounded-full bg-paw-blush" />
            </div>
            <button
              type="button"
              className="mt-4 inline-flex h-[68px] w-full items-center justify-center gap-4 rounded-[30px] border border-paw-pink bg-gradient-to-r from-paw-pink to-paw-rose text-[26px] font-black text-white shadow-[0_16px_32px_rgba(247,101,137,0.35)]"
              onClick={() => router.push("/auth?mode=login")}
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-paw-pink">
                <PawPrint className="h-7 w-7 fill-paw-pink/35" />
              </span>
              Go to Login
              <PawPrint className="h-8 w-8 fill-white/20" />
            </button>
            <button
              type="button"
              className="mt-4 inline-flex h-[60px] w-full items-center justify-center gap-4 rounded-[28px] border-2 border-paw-cocoa/10 bg-white/75 text-[21px] font-black text-paw-cocoa shadow-[0_10px_24px_rgba(122,81,63,0.08)]"
              onClick={() => router.push("/auth?mode=signup")}
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-paw-blush text-paw-pink">
                <UserRound size={24} />
              </span>
              Create Account
              <ChevronRight className="h-8 w-8 text-paw-pink" />
            </button>
          </div>
        </div>
      ) : guestLocked === null ? (
        <div className="flex flex-1 items-center justify-center px-5 text-sm font-black text-paw-cocoa/70">
          Checking chat access...
        </div>
      ) : !selectedThread ? (
        <div className="relative z-10 flex-1 space-y-5">
          <label className="flex h-[64px] items-center gap-4 rounded-[26px] bg-white/85 px-5 shadow-soft backdrop-blur">
            <Search size={29} className="shrink-0 text-paw-pink" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search conversations..."
              className="min-w-0 flex-1 bg-transparent text-base font-bold text-paw-ink outline-none placeholder:text-paw-cocoa/55"
            />
            <button
              type="button"
              onClick={() => setStatus("Conversation filters coming next.")}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-paw-pink text-white shadow-[0_10px_22px_rgba(247,101,137,0.32)]"
              aria-label="Filter conversations"
            >
              <SlidersHorizontal size={23} />
            </button>
          </label>

          <div className="space-y-4">
            {visibleThreads.map((thread, threadIndex) => {
              const tone = threadTone(threadIndex);
              const ToneIcon = tone.Icon;
              return (
                <button
                  key={thread.id}
                  type="button"
                  className="relative flex min-h-[118px] w-full items-center gap-4 overflow-hidden rounded-[28px] bg-white/86 p-4 text-left shadow-soft transition active:scale-[0.99]"
                  onClick={() => void openThread(thread)}
                >
                  <PawPrint size={52} className="pointer-events-none absolute bottom-4 right-12 fill-paw-peach/20 text-paw-peach/20" />
                  <span className="relative shrink-0">
                    <img src={thread.avatar} alt={thread.name} className="h-[76px] w-[76px] rounded-full object-cover ring-4 ring-white" />
                    <span className={`absolute bottom-0 right-0 h-5 w-5 rounded-full ${tone.dot} ring-4 ring-white`} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-3">
                      <span className="truncate text-[21px] font-black leading-tight text-paw-ink">
                        {thread.name} <PawPrint size={18} className={`inline -translate-y-0.5 fill-current/20 ${tone.paw}`} />
                      </span>
                      <span className={`shrink-0 text-sm font-black ${threadIndex === 0 ? "text-paw-pink" : "text-paw-cocoa/70"}`}>
                        {thread.time}
                      </span>
                    </span>
                    <span className={`mt-2 inline-flex max-w-full items-center gap-1 rounded-xl px-3 py-1 text-xs font-black ${tone.pill}`}>
                      <ToneIcon size={14} />
                      <span className="truncate">{thread.subtitle}</span>
                    </span>
                    <span className="mt-2 flex items-center gap-2">
                      <span className="truncate text-base font-bold text-paw-ink">{thread.lastMessage}</span>
                      {thread.lastMessage.toLowerCase().includes("image") ? <ImageIcon size={20} className="shrink-0 text-paw-pink" /> : null}
                    </span>
                  </span>
                  {tone.unread ? (
                    <span className="absolute right-5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-paw-pink text-sm font-black text-white shadow-soft">
                      {tone.unread}
                    </span>
                  ) : null}
                </button>
              );
            })}
            {!visibleThreads.length ? (
              <div className="rounded-[26px] bg-white/85 p-6 text-center text-sm font-black text-paw-cocoa shadow-soft">
                No conversations found.
              </div>
            ) : null}
          </div>

          <div className="pointer-events-none min-h-48 opacity-30">
            <div className="absolute bottom-16 left-[-50px] h-52 w-52 rounded-full bg-paw-blush blur-3xl" />
            <PawPrint size={64} className="absolute bottom-24 right-6 fill-paw-pink/10 text-paw-pink/10" />
          </div>
        </div>
      ) : (
        <div className="relative z-10 flex-1 space-y-5 pb-24">
          <div className="mx-auto flex w-fit items-center gap-2 rounded-full bg-paw-blush px-6 py-2 text-sm font-bold text-paw-pink shadow-soft">
            <Heart size={13} className="fill-paw-pink/40 text-paw-pink/40" />
            Today
            <Heart size={13} className="fill-paw-pink/40 text-paw-pink/40" />
          </div>

          {displayMessages.map((message) => (
            <div key={message.id} className={`relative flex ${message.from === "me" ? "justify-end" : "justify-start"}`}>
              {message.from === "them" ? (
                <span className="absolute -left-1 top-2 grid h-8 w-8 place-items-center rounded-full bg-white text-paw-pink shadow-soft">
                  <PawPrint size={17} className="fill-paw-pink/20" />
                </span>
              ) : (
                <Heart size={27} className="absolute -right-1 top-1 fill-[#8fbfff]/25 text-[#8fbfff]" />
              )}
              <div
                className={`max-w-[76%] px-5 py-4 shadow-soft ${
                  message.from === "me"
                    ? "rounded-[26px] bg-[#eaf4ff]"
                    : "ml-8 rounded-[26px] bg-white/92"
                }`}
              >
                {message.imageUrl ? (
                  <img
                    src={message.imageUrl}
                    alt={message.text}
                    className="mb-3 max-h-44 w-full rounded-3xl object-cover"
                  />
                ) : null}
                <p className="text-base font-bold leading-relaxed text-paw-ink">{message.imageUrl ? "Image attachment" : message.text}</p>
                <p className={`mt-2 text-right text-xs font-bold ${message.from === "me" ? "text-paw-cocoa/60" : "text-paw-pink/70"}`}>
                  {message.time}
                  {message.from === "me" ? <span className="ml-2 text-[#55a7ff]">✓✓</span> : null}
                </p>
              </div>
            </div>
          ))}

        </div>
      )}
      {selectedThread ? (
        <div className="fixed bottom-[76px] left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 rounded-t-[24px] bg-white/92 px-4 py-3 shadow-[0_-12px_28px_rgba(122,81,63,0.12)] backdrop-blur md:bottom-[100px] md:rounded-[24px]">
          <div className="flex items-center gap-2">
            <button
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-paw-blush bg-white text-paw-pink"
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
              <CirclePlus size={25} />
            </button>
            <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full border border-paw-blush bg-white px-4">
              <input
                placeholder="Type a message..."
                className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-paw-cocoa/55"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void sendMessage();
                }}
              />
              <Smile size={21} className="shrink-0 text-paw-pink" />
            </label>
            <button className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-paw-pink text-white shadow-[0_10px_22px_rgba(247,101,137,0.34)]" type="button" onClick={sendMessage}>
              <PawPrint size={23} className="fill-white/20" />
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
        <div className="fixed inset-0 z-50 grid place-items-center bg-paw-ink/35 px-5 backdrop-blur-sm">
          <div className="relative w-full max-w-[315px] overflow-hidden rounded-[28px] border-2 border-paw-peach/70 bg-[#fff8ee]/95 px-4 py-4 shadow-[0_24px_70px_rgba(58,34,26,0.28)]">
            <div className="mb-4 flex items-center justify-between gap-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-[18px] bg-paw-blush text-paw-pink">
                  <Bell size={28} className="fill-paw-blush/20" strokeWidth={2.7} />
                  <Sparkles className="absolute -right-1.5 top-0 h-3.5 w-3.5 fill-paw-butter text-paw-butter" />
                </span>
                <span className="min-w-0 text-left">
                  <h2 className="truncate text-[23px] font-black leading-tight text-paw-ink">Chat Alerts</h2>
                  <p className="mt-0.5 text-sm font-bold leading-none text-paw-cocoa/75">
                    Conversation updates
                  </p>
                </span>
              </div>
              <button
                type="button"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/80 text-paw-cocoa shadow-[0_10px_24px_rgba(122,81,63,0.12)]"
                onClick={() => setShowNotifications(false)}
                aria-label="Close notifications"
              >
                <X size={22} strokeWidth={3} />
              </button>
            </div>

            <div className="relative mb-4 flex min-h-[145px] items-center gap-2.5 rounded-[22px] border-2 border-paw-peach/55 bg-white/45 px-3.5 py-4 shadow-[0_10px_24px_rgba(122,81,63,0.06)]">
              <PawPrint className="pointer-events-none absolute right-3 top-4 h-8 w-8 rotate-12 fill-paw-peach/20 text-paw-peach/20" />
              <Sparkles className="absolute left-6 top-6 h-3.5 w-3.5 fill-paw-butter text-paw-butter" />
              <div className="relative grid h-24 w-24 shrink-0 place-items-end">
                <img
                  src={homepageImage.src}
                  alt=""
                  className="relative z-10 h-20 w-20 object-contain drop-shadow-[0_10px_14px_rgba(122,81,63,0.12)]"
                />
                <span className="absolute right-0 top-2 grid h-8 w-11 place-items-center rounded-[16px] bg-paw-rose text-white shadow-soft">
                  <span className="text-base leading-none">...</span>
                </span>
              </div>
              <div className="min-w-0 text-left">
                <h3 className="text-[17px] font-black leading-tight text-paw-ink">
                  No new messages right now.
                </h3>
                <p className="mt-1.5 text-xs font-bold leading-snug text-paw-cocoa/75">
                  New replies, image messages, and playdate updates will appear here.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="relative h-12 w-full overflow-hidden rounded-[22px] bg-gradient-to-r from-paw-pink to-paw-rose text-lg font-black text-white shadow-[0_16px_32px_rgba(247,101,137,0.32)]"
              onClick={() => setShowNotifications(false)}
            >
              <Heart className="absolute left-6 top-3.5 h-4 w-4 fill-white/30 text-white/30" />
              Done
              <Heart className="absolute right-6 top-3.5 h-4 w-4 fill-white/30 text-white/30" />
            </button>
          </div>
        </div>
      ) : null}
      <BottomNav />
    </section>
  );
}
