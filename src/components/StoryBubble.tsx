import { Plus } from "lucide-react";

type StoryBubbleProps = {
  name: string;
  image?: string;
  add?: boolean;
  onClick?: () => void;
};

export function StoryBubble({ name, image, add = false, onClick }: StoryBubbleProps) {
  return (
    <button type="button" className="w-[72px] shrink-0 text-center" onClick={onClick}>
      <span className="mx-auto grid h-[68px] w-[68px] place-items-center rounded-full bg-gradient-to-br from-paw-lavender via-paw-pink to-paw-lavender p-[3px] shadow-soft">
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
      <span className="mt-2 block truncate px-1 text-center text-[11px] font-extrabold leading-none text-paw-cocoa">
        {name}
      </span>
    </button>
  );
}
