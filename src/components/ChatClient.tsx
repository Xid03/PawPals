"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, Camera, ChevronRight, CirclePlus, Heart, Home, Image as ImageIcon, PawPrint, Pencil, Search, SlidersHorizontal, Smile, Sparkles, Trash2, UserRound, X } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { useCurrentUser } from "@/components/CurrentUserProvider";
import { StatusToast } from "@/components/StatusToast";
import { apiFetch, getToken, isGuestMode, requireSignedIn, type ApiConversation, type ApiMessage, type PublicUser } from "@/lib/api-client";
import bgChat from "../../images/bgChat.png";
import homepageImage from "../../images/homepage.png";
import loginIcon from "../../images/loginIcon.png";
import profile1 from "../../images/profile1.png";
import profileIcon from "../../images/profileIcon.png";

type DisplayMessage = {
  id: string;
  from: "me" | "them";
  text: string;
  time: string;
  date?: string;
  imageUrl?: string;
  storyReply?: NonNullable<ApiMessage["data"]>["storyReply"];
};

type StoryReplyPreview = NonNullable<ApiMessage["data"]>["storyReply"];

type ChatThread = {
  id: string;
  name: string;
  subtitle: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  isOnline: boolean;
  source: "api";
  conversation?: ApiConversation;
};

type ConversationFilter = "all" | "unread" | "online" | "media";

const conversationFilters: { label: string; value: ConversationFilter }[] = [
  { label: "All", value: "all" },
  { label: "Unread", value: "unread" },
  { label: "Online", value: "online" },
  { label: "Media", value: "media" }
];

const quickEmojis = ["😺", "😻", "🐾", "❤️", "😂", "🥰", "😸", "🙏", "✨", "🎉", "😿", "👍"];

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
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  })
    .format(new Date(createdAt))
    .replace(/\s/g, " ")
    .toUpperCase();
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatMessageDateLabel(createdAt?: string) {
  if (!createdAt) return "Today";

  const messageDate = new Date(createdAt);
  if (Number.isNaN(messageDate.getTime())) return "Today";

  const today = startOfDay(new Date());
  const messageDay = startOfDay(messageDate);
  const daysAgo = Math.round((today.getTime() - messageDay.getTime()) / 86_400_000);

  if (daysAgo === 0) return "Today";
  if (daysAgo === 1) return "Yesterday";

  const sameYear = messageDate.getFullYear() === today.getFullYear();
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" })
  }).format(messageDate);
}

function fallbackAvatar(user?: PublicUser) {
  return user?.avatarUrl || profileIcon.src;
}

function threadTone(index: number) {
  const tones = [
    { paw: "text-paw-pink", pill: "bg-paw-blush text-paw-cocoa", Icon: PawPrint },
    { paw: "text-[#93a4ff]", pill: "bg-[#efe8ff] text-paw-cocoa", Icon: Home },
    { paw: "text-[#ff873f]", pill: "bg-[#ffefe4] text-paw-cocoa", Icon: ImageIcon }
  ];
  return tones[index % tones.length];
}

export function ChatClient({
  initialGuestLocked = null,
  initialConversations = [],
  initialCurrentUserId = null,
  initialConversationId = null
}: {
  initialGuestLocked?: boolean | null;
  initialConversations?: ApiConversation[];
  initialCurrentUserId?: string | null;
  initialConversationId?: string | null;
}) {
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const messageLongPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const [guestLocked, setGuestLocked] = useState<boolean | null>(initialGuestLocked);
  const [conversations, setConversations] = useState<ApiConversation[]>(initialConversations);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [conversation, setConversation] = useState<ApiConversation | null>(null);
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [conversationFilter, setConversationFilter] = useState<ConversationFilter>("all");
  const [showConversationFilters, setShowConversationFilters] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [menuThread, setMenuThread] = useState<ChatThread | null>(null);
  const [isDeletingThread, setIsDeletingThread] = useState(false);
  const [menuMessage, setMenuMessage] = useState<DisplayMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<DisplayMessage | null>(null);
  const [pendingDeleteMessage, setPendingDeleteMessage] = useState<DisplayMessage | null>(null);
  const [editBody, setEditBody] = useState("");
  const [isSavingMessageAction, setIsSavingMessageAction] = useState(false);
  const [activeStoryReply, setActiveStoryReply] = useState<StoryReplyPreview | null>(null);
  const [targetConversationId, setTargetConversationId] = useState(initialConversationId);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isAttachingImage, setIsAttachingImage] = useState(false);
  const currentUserId = initialCurrentUserId ?? currentUser?.id ?? decodeCurrentUserId();

  useEffect(() => {
    const locked = initialGuestLocked === true && !getToken() ? true : isGuestMode();
    setGuestLocked(locked);
    if (locked) return;

    apiFetch<ApiConversation[]>("/api/conversations?limit=20")
      .then((items) => setConversations(items))
      .catch(() => setStatus(""));
  }, [initialGuestLocked]);

  const threads = useMemo(() => {
    const apiThreads = conversations.map((item) => {
      const otherParticipant =
        item.participants.find((participant) => participant.user.id !== currentUserId)?.user ?? item.participants[0]?.user;
      const latestMessage = item.messages?.[0];
      const latestStoryReply = latestMessage?.data?.storyReply;
      return {
        id: item.id,
        name: otherParticipant?.name ?? "PawPal",
        subtitle: otherParticipant?.username ? `@${otherParticipant.username}` : "Conversation",
        avatar: fallbackAvatar(otherParticipant),
        lastMessage: latestStoryReply
          ? "Replied to your story"
          : latestMessage?.type === "IMAGE"
            ? "Image attachment"
            : latestMessage?.body ?? "Start chatting",
        time: latestMessage ? formatMessageTime(latestMessage.createdAt) : "",
        unreadCount: item.unreadCount ?? 0,
        isOnline: otherParticipant?.isOnline === true,
        source: "api" as const,
        conversation: item
      };
    });

    return apiThreads;
  }, [conversations, currentUserId]);

  useEffect(() => {
    if (!targetConversationId || guestLocked) return;
    const thread = threads.find((item) => item.id === targetConversationId);
    if (!thread) return;
    if (selectedThread?.id === thread.id) return;
    void openThread(thread);
  }, [guestLocked, selectedThread?.id, targetConversationId, threads]);

  const visibleThreads = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return threads.filter((thread) => {
      const matchesSearch =
        !query ||
        [thread.name, thread.subtitle, thread.lastMessage].some((value) => value.toLowerCase().includes(query));
      const matchesFilter =
        conversationFilter === "all" ||
        (conversationFilter === "unread" && thread.unreadCount > 0) ||
        (conversationFilter === "online" && thread.isOnline) ||
        (conversationFilter === "media" && thread.lastMessage.toLowerCase().includes("image"));

      return matchesSearch && matchesFilter;
    });
  }, [conversationFilter, searchQuery, threads]);

  const displayMessages = useMemo<DisplayMessage[]>(() => {
    if (!selectedThread) return [];

    return messages.map((message) => ({
      id: message.id,
      from: message.senderId === currentUserId ? "me" : "them",
      text: message.body,
      time: formatMessageTime(message.createdAt),
      date: message.createdAt,
      imageUrl: message.type === "IMAGE" ? message.body : undefined,
      storyReply: message.data?.storyReply
    }));
  }, [currentUserId, messages, selectedThread]);

  const messageDateLabel = useMemo(() => {
    const latestMessage = displayMessages[displayMessages.length - 1];
    return formatMessageDateLabel(latestMessage?.date);
  }, [displayMessages]);

  useEffect(() => {
    if (!conversation?.id || guestLocked) return;

    const timer = window.setInterval(() => {
      apiFetch<ApiMessage[]>(`/api/conversations/${conversation.id}/messages`)
        .then((items) => setMessages(items))
        .catch(() => undefined);
    }, 3000);

    return () => window.clearInterval(timer);
  }, [conversation?.id, guestLocked]);

  async function openThread(thread: ChatThread) {
    setMenuThread(null);
    setSelectedThread(thread);
    setShowAttachments(false);
    setStatus("");
    setBody("");
    setShowEmojiPicker(false);

    if (thread.conversation) {
      setConversation(thread.conversation);
      setConversations((current) =>
        current.map((item) => (item.id === thread.conversation?.id ? { ...item, unreadCount: 0 } : item))
      );
      try {
        const readPromise = apiFetch(`/api/conversations/${thread.conversation.id}/read`, { method: "POST" }).catch(() => undefined);
        const data = await apiFetch<ApiMessage[]>(`/api/conversations/${thread.conversation.id}/messages`);
        setMessages(data);
        await readPromise;
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
    setTargetConversationId(null);
    setSelectedThread(null);
    setConversation(null);
    setMessages([]);
    setBody("");
    setStatus("");
    setShowAttachments(false);
    router.replace("/chats", { scroll: false });
  }

  function clearLongPressTimer() {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  function clearMessageLongPressTimer() {
    if (messageLongPressTimerRef.current !== null) {
      window.clearTimeout(messageLongPressTimerRef.current);
      messageLongPressTimerRef.current = null;
    }
  }

  function beginThreadPress(thread: ChatThread) {
    clearLongPressTimer();
    longPressTriggeredRef.current = false;
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      setMenuThread(thread);
      setStatus("");
    }, 520);
  }

  function endThreadPress() {
    clearLongPressTimer();
  }

  function beginMessagePress(message: DisplayMessage) {
    if (message.from !== "me") return;
    clearMessageLongPressTimer();
    messageLongPressTimerRef.current = window.setTimeout(() => {
      setMenuMessage(message);
      setStatus("");
    }, 520);
  }

  function endMessagePress() {
    clearMessageLongPressTimer();
  }

  function startEditMessage(message: DisplayMessage) {
    setMenuMessage(null);
    setEditingMessage(message);
    setEditBody(message.text);
  }

  async function saveEditedMessage() {
    const trimmedBody = editBody.trim();
    if (!editingMessage || !conversation || !trimmedBody || isSavingMessageAction) return;

    setIsSavingMessageAction(true);
    try {
      const data = await apiFetch<{ message: ApiMessage }>(
        `/api/conversations/${conversation.id}/messages/${editingMessage.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ body: trimmedBody })
        }
      );
      setMessages((current) => current.map((message) => (message.id === editingMessage.id ? data.message : message)));
      setEditingMessage(null);
      setEditBody("");
      setStatus("Message updated");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not edit message");
    } finally {
      setIsSavingMessageAction(false);
    }
  }

  async function deleteMessage(message: DisplayMessage) {
    if (!conversation || isSavingMessageAction) return;

    setIsSavingMessageAction(true);
    try {
      await apiFetch(`/api/conversations/${conversation.id}/messages/${message.id}`, { method: "DELETE" });
      setMessages((current) => current.filter((item) => item.id !== message.id));
      setMenuMessage(null);
      setPendingDeleteMessage(null);
      if (editingMessage?.id === message.id) {
        setEditingMessage(null);
        setEditBody("");
      }
      setStatus("Message deleted");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not delete message");
    } finally {
      setIsSavingMessageAction(false);
    }
  }

  async function deleteThread(thread: ChatThread) {
    if (isDeletingThread) return;
    setIsDeletingThread(true);
    setStatus("");
    try {
      if (thread.source === "api") {
        await apiFetch(`/api/conversations/${thread.id}`, { method: "DELETE" });
      }
      setConversations((current) => current.filter((item) => item.id !== thread.id));
      if (selectedThread?.id === thread.id) closeThread();
      setMenuThread(null);
      setStatus("Chat deleted");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not delete chat");
    } finally {
      setIsDeletingThread(false);
    }
  }

  async function sendMessage() {
    const trimmedBody = body.trim();
    if (!trimmedBody) return;
    try {
      requireSignedIn();
      if (!conversation) {
        setStatus("Open a real conversation to send messages.");
        return;
      }
      const data = await apiFetch<{ message: ApiMessage }>(`/api/conversations/${conversation.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ body: trimmedBody, type: "TEXT" })
      });
      setMessages((current) => [...current, data.message]);
      setBody("");
      setShowEmojiPicker(false);
      setStatus("Message sent");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not send message");
    }
  }

  async function attachImage(file: File | null | undefined) {
    if (!file) return;
    try {
      requireSignedIn();
      if (isAttachingImage) return;
      if (!file.type.startsWith("image/")) {
        setStatus("Please choose an image file.");
        return;
      }

      if (!conversation) {
        setStatus("Open a real conversation to send images.");
        return;
      }

      setIsAttachingImage(true);
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
      setShowEmojiPicker(false);
      setStatus("Image sent");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not attach image");
    } finally {
      setIsAttachingImage(false);
    }
  }

  function addEmoji(emoji: string) {
    setBody((current) => `${current}${emoji}`);
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
                {selectedThread.isOnline ? (
                  <p className="mt-0.5 text-sm font-bold text-[#46ae63]">
                    Online <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#46ae63]" />
                  </p>
                ) : null}
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
        </header>
      )}
      <StatusToast message={status} onDismiss={() => setStatus("")} />
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
          <div className="space-y-3">
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
                onClick={() => {
                  setShowConversationFilters((current) => !current);
                  setStatus("");
                }}
                className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl shadow-[0_10px_22px_rgba(247,101,137,0.32)] ${
                  showConversationFilters || conversationFilter !== "all" ? "bg-paw-pink text-white" : "bg-paw-blush text-paw-pink"
                }`}
                aria-label="Filter conversations"
                aria-expanded={showConversationFilters}
              >
                <SlidersHorizontal size={23} />
              </button>
            </label>

            {showConversationFilters ? (
              <div className="grid grid-cols-4 gap-2 rounded-[22px] bg-white/80 p-2 shadow-soft backdrop-blur">
                {conversationFilters.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => {
                      setConversationFilter(filter.value);
                      setStatus("");
                    }}
                    className={`h-10 rounded-[16px] text-xs font-black transition ${
                      conversationFilter === filter.value
                        ? "bg-paw-pink text-white shadow-[0_8px_18px_rgba(247,101,137,0.26)]"
                        : "bg-paw-blush/70 text-paw-cocoa"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            {visibleThreads.map((thread, threadIndex) => {
              const tone = threadTone(threadIndex);
              const ToneIcon = tone.Icon;
              return (
                <div key={thread.id} className="relative">
                  <button
                    type="button"
                    className={`relative flex min-h-[118px] w-full touch-manipulation select-none items-center gap-4 overflow-hidden rounded-[28px] bg-white/86 p-4 text-left shadow-soft transition ${
                      menuThread?.id === thread.id ? "scale-[0.99] ring-2 ring-paw-pink/45" : "active:scale-[0.99]"
                    }`}
                    onPointerDown={() => beginThreadPress(thread)}
                    onPointerUp={endThreadPress}
                    onPointerLeave={endThreadPress}
                    onPointerCancel={endThreadPress}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      setMenuThread(thread);
                    }}
                    onClick={(event) => {
                      if (longPressTriggeredRef.current) {
                        event.preventDefault();
                        longPressTriggeredRef.current = false;
                        return;
                      }
                      void openThread(thread);
                    }}
                  >
                    <PawPrint size={52} className="pointer-events-none absolute bottom-4 right-12 fill-paw-peach/20 text-paw-peach/20" />
                    <span className="relative shrink-0">
                      <img src={thread.avatar} alt={thread.name} className="h-[76px] w-[76px] rounded-full object-cover ring-4 ring-white" />
                      {thread.isOnline ? (
                        <span className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-[#50d66e] ring-4 ring-white" />
                      ) : null}
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
                    {thread.unreadCount > 0 ? (
                      <span className="absolute right-5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-paw-pink text-sm font-black text-white shadow-soft">
                        {thread.unreadCount > 99 ? "99+" : thread.unreadCount}
                      </span>
                    ) : null}
                  </button>
                  {menuThread?.id === thread.id ? (
                    <div className="absolute right-4 top-4 z-20 flex items-center gap-2 rounded-2xl border border-paw-rose/35 bg-white/95 p-2 shadow-[0_16px_36px_rgba(122,81,63,0.2)] backdrop-blur">
                      <button
                        type="button"
                        onClick={() => void deleteThread(thread)}
                        disabled={isDeletingThread}
                        className="inline-flex h-11 items-center gap-2 rounded-xl bg-paw-pink px-4 text-sm font-black text-white shadow-soft disabled:opacity-70"
                      >
                        <Trash2 size={17} />
                        {isDeletingThread ? "Deleting..." : "Delete Chat"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setMenuThread(null)}
                        className="grid h-11 w-11 place-items-center rounded-xl bg-paw-blush text-paw-cocoa"
                        aria-label="Cancel delete chat"
                      >
                        <X size={19} strokeWidth={3} />
                      </button>
                    </div>
                  ) : null}
                </div>
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
            {messageDateLabel}
            <Heart size={13} className="fill-paw-pink/40 text-paw-pink/40" />
          </div>

          {displayMessages.map((message) => (
            <div
              key={message.id}
              className={`group relative flex ${message.from === "me" ? "justify-end" : "justify-start"}`}
              onMouseEnter={() => {
                if (message.from === "me") setMenuMessage(message);
              }}
              onMouseLeave={() => {
                if (menuMessage?.id === message.id) setMenuMessage(null);
              }}
              onPointerDown={() => beginMessagePress(message)}
              onPointerUp={endMessagePress}
              onPointerCancel={endMessagePress}
              onPointerLeave={endMessagePress}
            >
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
                  <button
                    type="button"
                    onClick={() => setPreviewImageUrl(message.imageUrl ?? null)}
                    className="mb-3 block w-full overflow-hidden rounded-3xl text-left transition active:scale-[0.99]"
                    aria-label="View image full size"
                  >
                    <img
                      src={message.imageUrl}
                      alt={message.text}
                      className="max-h-44 w-full object-cover"
                    />
                  </button>
                ) : null}
                {message.storyReply ? (
                  <button
                    type="button"
                    onClick={() => setActiveStoryReply(message.storyReply ?? null)}
                    className="mb-3 w-full overflow-hidden rounded-2xl border border-paw-pink/15 bg-white/70 text-left transition hover:bg-white"
                    aria-label="Open original story"
                  >
                    <div className="flex gap-3 p-2.5">
                      <div className="h-16 w-12 shrink-0 overflow-hidden rounded-xl bg-paw-blush">
                        {message.storyReply.storyType === "VIDEO" ? (
                          <video src={message.storyReply.storyUrl} className="h-full w-full object-cover" muted />
                        ) : (
                          <img src={message.storyReply.storyUrl} alt="Story reply" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black uppercase tracking-wide text-paw-pink">Story reply</p>
                        <p className="mt-1 truncate text-xs font-bold text-paw-cocoa/70">
                          {message.storyReply.storyOwnerName ? `${message.storyReply.storyOwnerName}'s story` : "Original story"}
                        </p>
                        {message.storyReply.storyCaption ? (
                          <p className="mt-1 line-clamp-2 text-xs font-bold leading-snug text-paw-ink">{message.storyReply.storyCaption}</p>
                        ) : null}
                      </div>
                    </div>
                  </button>
                ) : null}
                <p className="text-base font-bold leading-relaxed text-paw-ink">{message.imageUrl ? "Image attachment" : message.text}</p>
                <p className={`mt-2 text-right text-xs font-bold ${message.from === "me" ? "text-paw-cocoa/60" : "text-paw-pink/70"}`}>
                  {message.time}
                  {message.from === "me" ? <span className="ml-2 text-[#55a7ff]">✓✓</span> : null}
                </p>
              </div>
              {message.from === "me" && menuMessage?.id === message.id ? (
                <div className="absolute -top-9 right-6 z-20 flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 shadow-[0_10px_24px_rgba(122,81,63,0.14)]">
                  {!message.imageUrl ? (
                    <button
                      type="button"
                      onClick={() => startEditMessage(message)}
                      className="grid h-8 w-8 place-items-center rounded-full text-paw-cocoa hover:bg-paw-blush"
                      aria-label="Edit message"
                    >
                      <Pencil size={15} />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setMenuMessage(null);
                      setPendingDeleteMessage(message);
                    }}
                    disabled={isSavingMessageAction}
                    className="grid h-8 w-8 place-items-center rounded-full text-paw-rose hover:bg-paw-blush disabled:opacity-60"
                    aria-label="Delete message"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ) : null}
            </div>
          ))}

        </div>
      )}
      {editingMessage ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-paw-ink/35 px-5 backdrop-blur-md transition-opacity duration-200">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void saveEditedMessage();
            }}
            className="relative w-full max-w-[392px] animate-[modalPop_180ms_ease-out] overflow-hidden rounded-[38px] border-[3px] border-paw-blush/65 bg-[#fff8ee] px-6 pb-7 pt-8 shadow-[0_34px_90px_rgba(58,34,26,0.3)] ring-4 ring-white/55"
          >
            <div className="pointer-events-none absolute inset-2 rounded-[34px] border border-paw-blush/45" />
            <PawPrint className="pointer-events-none absolute -left-3 bottom-32 h-16 w-16 rotate-[-12deg] fill-paw-peach/20 text-paw-peach/20" />
            <PawPrint className="pointer-events-none absolute -right-2 bottom-32 h-16 w-16 rotate-12 fill-paw-peach/20 text-paw-peach/20" />
            <Sparkles className="pointer-events-none absolute left-8 top-9 h-5 w-5 fill-paw-butter text-paw-butter" />
            <Sparkles className="pointer-events-none absolute right-[29%] top-20 h-5 w-5 fill-paw-butter text-paw-butter" />
            <span className="pointer-events-none absolute right-[23%] top-12 h-3 w-3 rounded-full border-4 border-paw-blush" />

            <button
              type="button"
              onClick={() => {
                setEditingMessage(null);
                setEditBody("");
              }}
              className="absolute right-6 top-7 z-10 grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white/95 text-paw-cocoa shadow-[0_14px_30px_rgba(247,101,137,0.23)] ring-2 ring-paw-blush/45"
              aria-label="Close edit message"
            >
              <X size={29} strokeWidth={3} />
            </button>

            <div className="relative mb-7 pr-16 text-left">
              <div className="min-w-0">
                <h2 className="flex items-center gap-2 whitespace-nowrap text-[30px] font-black leading-tight text-paw-ink min-[390px]:text-[34px]">
                  Edit Message
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/80 text-paw-pink shadow-[0_8px_18px_rgba(247,101,137,0.18)] min-[390px]:h-11 min-[390px]:w-11">
                    <PawPrint className="h-7 w-7 fill-paw-pink/65 text-paw-pink min-[390px]:h-8 min-[390px]:w-8" />
                  </span>
                </h2>
                <div className="mt-4 h-1 w-48 rounded-full border-t-4 border-dashed border-paw-blush" />
              </div>
            </div>

            <label className="relative block">
              <textarea
                value={editBody}
                onChange={(event) => setEditBody(event.target.value)}
                className="min-h-[190px] w-full resize-none rounded-[30px] border-[3px] border-paw-blush/80 bg-white/95 px-6 py-6 pr-20 text-xl font-black leading-relaxed text-paw-ink shadow-[0_14px_32px_rgba(247,101,137,0.12)] outline-none transition focus:border-paw-pink min-[390px]:min-h-[220px] min-[390px]:text-[22px]"
                maxLength={500}
                autoFocus
              />
              <span className="absolute bottom-6 right-6 inline-flex items-center gap-2 text-lg font-black text-paw-cocoa/65">
                {editBody.length}/500
                <span className="text-[30px] leading-none text-paw-blush">♡</span>
              </span>
            </label>

            <div className="my-6 flex items-center justify-center">
              <Heart className="h-7 w-7 fill-paw-rose text-paw-rose drop-shadow-[0_5px_10px_rgba(247,101,137,0.18)]" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setEditingMessage(null);
                  setEditBody("");
                }}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-[24px] border-2 border-paw-blush bg-white/88 text-base font-black text-paw-ink shadow-[0_12px_26px_rgba(122,81,63,0.08)] min-[390px]:h-16 min-[390px]:gap-3 min-[390px]:rounded-[28px] min-[390px]:text-xl"
              >
                <span className="grid h-10 w-10 place-items-center rounded-full bg-paw-blush/65 text-paw-cocoa">
                  <X size={22} strokeWidth={3} />
                </span>
                Cancel
              </button>
              <button
                type="submit"
                disabled={!editBody.trim() || isSavingMessageAction}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-[24px] bg-gradient-to-r from-paw-pink to-paw-rose text-base font-black text-white shadow-[0_18px_34px_rgba(247,101,137,0.4)] disabled:opacity-60 min-[390px]:h-16 min-[390px]:gap-3 min-[390px]:rounded-[28px] min-[390px]:text-xl"
              >
                {isSavingMessageAction ? "Saving..." : "Save"}
                <PawPrint className="h-6 w-6 fill-white/30 text-white" />
              </button>
            </div>
          </form>
        </div>
      ) : null}
      {pendingDeleteMessage ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-paw-ink/35 px-5 backdrop-blur-md transition-opacity duration-200">
          <div className="relative w-full max-w-[360px] animate-[modalPop_180ms_ease-out] overflow-hidden rounded-[34px] border border-white/75 bg-[#fff8ee]/95 px-6 pb-6 pt-7 text-center shadow-[0_30px_80px_rgba(58,34,26,0.28)]">
            <PawPrint className="pointer-events-none absolute left-6 top-6 h-12 w-12 rotate-[-14deg] fill-paw-peach/20 text-paw-peach/20" />
            <PawPrint className="pointer-events-none absolute right-6 top-[118px] h-12 w-12 rotate-12 fill-paw-peach/20 text-paw-peach/20" />
            <Sparkles className="pointer-events-none absolute left-[31%] top-11 h-5 w-5 fill-paw-blush text-paw-blush" />
            <Sparkles className="pointer-events-none absolute right-[27%] top-14 h-5 w-5 fill-paw-butter text-paw-butter" />

            <div className="relative mx-auto grid h-[104px] w-[104px] place-items-center rounded-full bg-paw-blush/55 shadow-[0_16px_36px_rgba(247,101,137,0.14)] ring-4 ring-white">
              <div className="grid h-[74px] w-[74px] place-items-center rounded-[24px] bg-gradient-to-br from-paw-pink to-paw-rose text-white shadow-[0_14px_28px_rgba(247,101,137,0.35)] ring-4 ring-white/80">
                <Trash2 size={34} />
                <PawPrint className="absolute h-5 w-5 translate-y-2 fill-white/35 text-white/35" />
              </div>
            </div>

            <h2 className="mt-6 text-[31px] font-black leading-tight text-paw-ink">Delete this message?</h2>
            <p className="mx-auto mt-3 max-w-[270px] text-center text-base font-bold leading-relaxed text-paw-cocoa/70">
              This message will be removed from the conversation.
            </p>

            <div className="my-5 flex items-center justify-center gap-3 text-paw-blush">
              <span className="h-0.5 w-24 rounded-full border-t-2 border-dashed border-paw-blush" />
              <Heart className="h-5 w-5 shrink-0 fill-paw-rose text-paw-rose" />
              <span className="h-0.5 w-24 rounded-full border-t-2 border-dashed border-paw-blush" />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPendingDeleteMessage(null)}
                disabled={isSavingMessageAction}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-[24px] border-2 border-paw-blush bg-white/80 text-base font-black text-paw-ink shadow-[0_10px_22px_rgba(122,81,63,0.07)] disabled:opacity-60"
              >
                <X size={22} strokeWidth={3} />
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void deleteMessage(pendingDeleteMessage)}
                disabled={isSavingMessageAction}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-[24px] bg-gradient-to-r from-paw-pink to-paw-rose text-base font-black text-white shadow-[0_16px_30px_rgba(247,101,137,0.32)] disabled:opacity-60"
              >
                <Trash2 size={22} />
                {isSavingMessageAction ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {previewImageUrl ? (
        <div
          onClick={() => setPreviewImageUrl(null)}
          className="fixed inset-0 z-[75] flex items-center justify-center bg-paw-ink/80 px-4 py-8 backdrop-blur-md transition-opacity"
          role="presentation"
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setPreviewImageUrl(null);
            }}
            className="absolute right-5 top-6 z-10 grid h-12 w-12 place-items-center rounded-full bg-white/92 text-paw-cocoa shadow-soft"
            aria-label="Close image preview"
          >
            <X size={26} strokeWidth={3} />
          </button>
          <div
            onClick={(event) => event.stopPropagation()}
            className="relative max-h-full w-full max-w-[420px] overflow-hidden rounded-[28px] bg-white/10 p-2 shadow-[0_24px_70px_rgba(0,0,0,0.35)]"
          >
            <img
              src={previewImageUrl}
              alt="Chat attachment preview"
              className="max-h-[82vh] w-full rounded-[22px] object-contain"
            />
          </div>
        </div>
      ) : null}
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
                  setShowEmojiPicker(false);
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
              <button
                type="button"
                onClick={() => {
                  try {
                    requireSignedIn();
                    setShowEmojiPicker((current) => !current);
                    setShowAttachments(false);
                  } catch (error) {
                    setStatus(error instanceof Error ? error.message : "Please log in to send emojis.");
                  }
                }}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-paw-pink transition hover:bg-paw-blush/55"
                aria-label="Open emoji picker"
                aria-expanded={showEmojiPicker}
              >
                <Smile size={21} />
              </button>
            </label>
            <button className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-paw-pink text-white shadow-[0_10px_22px_rgba(247,101,137,0.34)]" type="button" onClick={sendMessage}>
              <PawPrint size={23} className="fill-white/20" />
            </button>
          </div>
          {showEmojiPicker ? (
            <div className="mt-3 grid grid-cols-6 gap-2 rounded-[22px] border border-paw-blush bg-white/88 p-3 shadow-[0_12px_28px_rgba(122,81,63,0.1)]">
              {quickEmojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => addEmoji(emoji)}
                  className="grid h-10 place-items-center rounded-2xl bg-paw-blush/45 text-xl transition hover:bg-paw-blush active:scale-95"
                  aria-label={`Add emoji ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          ) : null}
          {showAttachments ? (
            <div className="mt-3 flex gap-3 pl-14 text-paw-cocoa">
              <button
                type="button"
                className="flex items-center gap-2 rounded-full bg-white/75 px-3 py-2 text-xs font-black disabled:opacity-60"
                onClick={() => openAttachmentPicker("camera")}
                disabled={isAttachingImage}
                aria-label="Open camera"
              >
                <Camera size={17} />
                {isAttachingImage ? "Sending..." : "Camera"}
              </button>
              <button
                type="button"
                className="flex items-center gap-2 rounded-full bg-white/75 px-3 py-2 text-xs font-black disabled:opacity-60"
                onClick={() => openAttachmentPicker("image")}
                disabled={isAttachingImage}
                aria-label="Choose image"
              >
                <ImageIcon size={17} />
                {isAttachingImage ? "Sending..." : "Photo"}
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
      {activeStoryReply ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-paw-ink/85 px-5 py-8 text-white backdrop-blur-sm">
          <div className="relative flex h-[84vh] max-h-[690px] w-full max-w-[360px] flex-col overflow-hidden rounded-[24px] bg-black shadow-[0_20px_48px_rgba(10,35,60,0.42)]">
            <div className="flex items-center justify-between gap-3 bg-black/60 px-4 py-4">
              <div className="min-w-0">
                <p className="text-sm font-black uppercase tracking-wide text-paw-pink">Story reply</p>
                <p className="truncate text-base font-black">
                  {activeStoryReply.storyOwnerName ? `${activeStoryReply.storyOwnerName}'s story` : "Original story"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveStoryReply(null)}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/14 text-white shadow-soft"
                aria-label="Close story"
              >
                <X size={24} strokeWidth={3} />
              </button>
            </div>
            <div className="relative min-h-0 flex-1 bg-black">
              {activeStoryReply.storyType === "VIDEO" ? (
                <video src={activeStoryReply.storyUrl} className="h-full w-full object-contain" controls autoPlay />
              ) : (
                <img src={activeStoryReply.storyUrl} alt="Original story" className="h-full w-full object-contain" />
              )}
              {activeStoryReply.storyCaption ? (
                <p className="absolute inset-x-4 bottom-4 rounded-2xl bg-black/55 px-4 py-3 text-center text-sm font-bold leading-relaxed backdrop-blur-sm">
                  {activeStoryReply.storyCaption}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
      <BottomNav />
    </section>
  );
}
