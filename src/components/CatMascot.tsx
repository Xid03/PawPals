export function CatMascot({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`relative mx-auto ${
        compact ? "h-24 w-36" : "h-44 w-64"
      }`}
      aria-label="Cute cat illustration"
      role="img"
    >
      <div className="absolute bottom-0 left-1/2 h-[72%] w-[78%] -translate-x-1/2 rounded-[48%] border-4 border-paw-ink bg-[#FFF2D8]" />
      <div className="cat-ear-left absolute left-[18%] top-[18%] h-[26%] w-[24%] rotate-[-18deg] border-4 border-paw-ink bg-paw-peach" />
      <div className="cat-ear-right absolute right-[18%] top-[18%] h-[26%] w-[24%] rotate-[18deg] border-4 border-paw-ink bg-[#B8B5B2]" />
      <div className="absolute left-[28%] top-[54%] h-4 w-4 rounded-full bg-paw-ink" />
      <div className="absolute right-[28%] top-[54%] h-4 w-4 rounded-full bg-paw-ink" />
      <div className="absolute left-1/2 top-[64%] h-4 w-5 -translate-x-1/2 rounded-b-full rounded-t-md bg-paw-pink" />
      <div className="absolute left-[22%] top-[66%] h-0.5 w-10 rotate-[8deg] rounded-full bg-paw-ink" />
      <div className="absolute left-[20%] top-[72%] h-0.5 w-11 rotate-[-8deg] rounded-full bg-paw-ink" />
      <div className="absolute right-[22%] top-[66%] h-0.5 w-10 rotate-[-8deg] rounded-full bg-paw-ink" />
      <div className="absolute right-[20%] top-[72%] h-0.5 w-11 rotate-[8deg] rounded-full bg-paw-ink" />
      <div className="absolute bottom-[4%] left-[4%] h-[26%] w-[25%] rounded-t-full border-4 border-paw-ink bg-[#FFF2D8]" />
      <div className="absolute bottom-[4%] right-[4%] h-[26%] w-[25%] rounded-t-full border-4 border-paw-ink bg-[#FFF2D8]" />
    </div>
  );
}
