export type ApiEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type PublicUser = {
  id: string;
  name: string;
  username: string;
  email?: string;
  bio?: string | null;
  avatarUrl?: string | null;
  city?: string | null;
  isOnline?: boolean;
  isPrivate?: boolean;
};

export type ApiCat = {
  id: string;
  name: string;
  ageMonths: number;
  gender: "MALE" | "FEMALE" | "UNKNOWN";
  breed: string;
  personalityTags: string[];
  lookingFor: string[];
  city?: string | null;
  description?: string | null;
  distanceKm?: number | null;
  photos?: { url: string }[];
  owner?: PublicUser;
};

export type ApiPost = {
  id: string;
  text: string;
  topic: string;
  createdAt: string;
  author: PublicUser;
  images?: { url: string }[];
  savedByMe?: boolean;
  _count?: {
    likes: number;
    comments: number;
    saves?: number;
  };
};

export type ApiVet = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  address: string;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
  distanceKm?: number | null;
  rating: number;
  isOpen: boolean;
  openHours?: string | null;
  services?: { type: string }[];
  _count?: {
    favorites: number;
  };
};

export type ApiEvent = {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  imageUrl?: string | null;
  startsAt: string;
  location: string;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  distanceKm?: number | null;
  savedByMe?: boolean;
  _count?: {
    rsvps: number;
    saves: number;
  };
};

export type ApiHealthTip = {
  id: string;
  title: string;
  body: string;
  category: string;
  imageUrl?: string | null;
  isDaily: boolean;
  publishedAt: string;
};

export type ApiConversation = {
  id: string;
  participants: { user: PublicUser }[];
  messages?: ApiMessage[];
  unreadCount?: number;
};

export type ApiMessage = {
  id: string;
  body: string;
  type: string;
  senderId: string;
  createdAt: string;
  sender?: PublicUser;
};

const TOKEN_KEY = "pawpals_token";
const GUEST_KEY = "pawpals_guest";
export const guestLimitMessage = "Please log in or create an account to use this feature.";
const GUEST_LIMIT_EVENT = "pawpals:guest-limit";

class GuestLimitError extends Error {
  constructor() {
    super("");
    this.name = "GuestLimitError";
  }
}

function showGuestLimitDialog() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(GUEST_LIMIT_EVENT, {
        detail: { message: guestLimitMessage }
      })
    );
  }
}

export function listenForGuestLimitDialog(callback: (message: string) => void) {
  if (typeof window === "undefined") return () => undefined;

  function handleGuestLimit(event: Event) {
    const detail = (event as CustomEvent<{ message?: string }>).detail;
    callback(detail?.message ?? guestLimitMessage);
  }

  window.addEventListener(GUEST_LIMIT_EVENT, handleGuestLimit);
  return () => window.removeEventListener(GUEST_LIMIT_EVENT, handleGuestLimit);
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function isGuestMode() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(GUEST_KEY) === "true" && !getToken();
}

export function setGuestMode() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.setItem(GUEST_KEY, "true");
  }
}

export function clearGuestMode() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(GUEST_KEY);
  }
}

export function requireSignedIn() {
  if (isGuestMode()) {
    showGuestLimitDialog();
    throw new GuestLimitError();
  }
}

export function setToken(token: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(TOKEN_KEY, token);
    window.localStorage.removeItem(GUEST_KEY);
  }
}

export function clearToken() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getToken();
  const method = (options.method ?? "GET").toUpperCase();

  const isAuthMutation = path.startsWith("/api/auth/login") || path.startsWith("/api/auth/register");

  if (isGuestMode() && !isAuthMutation && !["GET", "HEAD", "OPTIONS"].includes(method)) {
    showGuestLimitDialog();
    throw new GuestLimitError();
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...options,
    headers,
    credentials: "include"
  });

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error?.message ?? `Request failed with ${response.status}`);
  }

  return payload.data as T;
}

export function ageLabel(ageMonths: number) {
  if (ageMonths < 12) return `${ageMonths} months`;
  const years = Math.floor(ageMonths / 12);
  return `${years} ${years === 1 ? "year" : "years"}`;
}

export function catImage(cat: ApiCat, fallback: string) {
  return cat.photos?.[0]?.url ?? fallback;
}

export function distanceLabel(cat: ApiCat) {
  if (typeof cat.distanceKm === "number") {
    return cat.distanceKm < 1 ? `${Math.round(cat.distanceKm * 1000)} m away` : `${cat.distanceKm} km away`;
  }

  return cat.city ?? "Nearby";
}
