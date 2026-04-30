"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, MapPin, PawPrint, Search } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { PostCard, type DisplayPost } from "@/components/PostCard";
import { apiFetch, ageLabel, catImage, type ApiCat, type ApiPost } from "@/lib/api-client";
import { currentUser, cats as mockCats, posts as mockPosts, quickActions } from "@/data/mockData";

function mapPost(post: ApiPost): DisplayPost {
  return {
    id: post.id,
    user: post.author?.username ?? "PawPal",
    avatar: post.author?.avatarUrl ?? currentUser.avatar,
    time: "Just now",
    text: post.text,
    image: post.images?.[0]?.url,
    likes: post._count?.likes ?? 0,
    comments: post._count?.comments ?? 0
  };
}

export function HomeClient() {
  const [cats, setCats] = useState(mockCats);
  const [posts, setPosts] = useState<DisplayPost[]>(mockPosts);
  const [userName, setUserName] = useState("Cat Lover");

  useEffect(() => {
    apiFetch<{ user: { name: string; avatarUrl?: string | null } }>("/api/auth/me")
      .then(({ user }) => setUserName(user.name || "Cat Lover"))
      .catch(() => undefined);

    apiFetch<ApiCat[]>("/api/cats?limit=4")
      .then((items) => {
        if (items.length) {
          setCats(
            items.map((cat) => ({
              id: cat.id,
              name: cat.name,
              gender: cat.gender,
              breed: cat.breed,
              age: ageLabel(cat.ageMonths),
              distance: cat.city ?? "Nearby",
              image: catImage(cat, mockCats[0].image),
              about: cat.description ?? "",
              personality: cat.personalityTags,
              lookingFor: cat.lookingFor
            }))
          );
        }
      })
      .catch(() => undefined);

    apiFetch<ApiPost[]>("/api/feed?mode=for-you&limit=1")
      .then((items) => {
        if (items.length) setPosts(items.map(mapPost));
      })
      .catch(() => undefined);
  }, []);

  const avatarStack = useMemo(() => cats.slice(0, 4), [cats]);

  return (
    <section className="min-h-screen bg-paw-radial px-5 pb-28 pt-6">
      <header className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <img
            src={currentUser.avatar}
            alt={userName}
            className="h-12 w-12 rounded-full object-cover ring-2 ring-paw-peach"
          />
          <div>
            <h1 className="max-w-64 text-2xl font-black leading-tight text-paw-ink">
              Good Meowning, {userName}!
            </h1>
          </div>
        </div>
        <Link
          href="/profile"
          className="grid h-10 w-10 place-items-center rounded-full bg-white/60"
          aria-label="Open notifications"
        >
          <Bell size={19} />
        </Link>
      </header>

      <label className="paw-input mb-5 flex h-14 items-center gap-3 rounded-2xl px-4">
        <Search size={18} className="text-paw-cocoa" />
        <input
          placeholder="Search PawPals, tips, vets..."
          className="w-full bg-transparent text-sm font-bold outline-none"
        />
        <span className="grid h-8 w-8 place-items-center rounded-full bg-paw-rose text-white">
          <PawPrint size={17} />
        </span>
      </label>

      <section className="mb-4 rounded-3xl bg-gradient-to-br from-paw-peach to-paw-rose p-5 text-center text-white shadow-soft">
        <h2 className="text-base font-black">Meet Nearby PawPals</h2>
        <div className="my-4 flex justify-center -space-x-3">
          {avatarStack.map((cat) => (
            <img
              key={cat.id}
              src={cat.image}
              alt={cat.name}
              className="h-14 w-14 rounded-full object-cover ring-4 ring-white/70"
            />
          ))}
        </div>
        <p className="mb-3 text-xs font-bold">{cats.length} cats ready to meet</p>
        <Link
          href="/discover"
          className="mx-auto inline-flex items-center gap-2 rounded-full bg-paw-pink px-7 py-3 text-sm font-black shadow-soft"
        >
          Explore <PawPrint size={17} />
        </Link>
      </section>

      <section className="mb-6 grid grid-cols-2 gap-3">
        {quickActions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className={`flex min-h-20 items-center gap-3 rounded-2xl p-4 shadow-soft ${action.color}`}
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white/55">
              <img src={action.icon} alt="" className="h-full w-full object-cover object-center" />
            </span>
            <span className="text-sm font-black leading-tight text-paw-ink">{action.title}</span>
          </Link>
        ))}
      </section>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-black">Recent Posts</h2>
        <Link href="/community" className="text-xs font-extrabold text-paw-cocoa/70">
          See all
        </Link>
      </div>
      <PostCard post={posts[0]} compact />
      <div className="mt-3 flex items-center gap-1 text-xs font-bold text-paw-cocoa/70">
        <MapPin size={14} /> Live from the PawPals API
      </div>
      <BottomNav />
    </section>
  );
}
