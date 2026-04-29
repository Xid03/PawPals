import type { ReactNode } from "react";

type TagChipProps = {
  children: ReactNode;
  active?: boolean;
  tone?: "pink" | "lavender" | "cream" | "peach";
  className?: string;
};

const tones = {
  pink: "bg-paw-blush text-paw-pink",
  lavender: "bg-paw-lilac text-paw-lavender",
  cream: "bg-white/70 text-paw-cocoa",
  peach: "bg-[#FFE0C5] text-paw-cocoa"
};

export function TagChip({
  children,
  active = false,
  tone = "cream",
  className = ""
}: TagChipProps) {
  return (
    <span
      className={`inline-flex h-9 items-center justify-center rounded-2xl px-4 text-xs font-extrabold ${
        active ? "bg-paw-lavender text-white shadow-soft" : tones[tone]
      } ${className}`}
    >
      {children}
    </span>
  );
}
