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
  avatarUrl?: string | null;
  city?: string | null;
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
    appointments: number;
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
};

export type ApiMessage = {
  id: string;
  body: string;
  type: string;
  senderId: string;
  createdAt: string;
  sender?: PublicUser;
};

export function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("pawpals_token");
}

export function setToken(token: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("pawpals_token", token);
  }
}

export function clearToken() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("pawpals_token");
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getToken();

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
