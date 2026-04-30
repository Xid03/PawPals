import { Plus } from "lucide-react";

type StoryBubbleProps = {
  name: string;
  image?: string;
  add?: boolean;
  onClick?: () => void;
};

export function StoryBubble({ name, image, add = false, onClick }: StoryBubbleProps) {
  return (
    <button type="button" className="w-16 shrink-0 text-center" onClick={onClick}>
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-paw-lavender to-paw-pink p-1 shadow-soft">
        {add ? (
          <span className="grid h-full w-full place-items-center rounded-full bg-paw-lavender text-white">
            <Plus size={28} />
          </span>
        ) : (
          <img
            src={image}
            alt={name}
            className="h-full w-full rounded-full object-cover ring-2 ring-white"
          />
        )}
      </span>
      <span className="mt-2 block truncate text-[11px] font-extrabold text-paw-cocoa">
        {name}
      </span>
    </button>
  );
}
