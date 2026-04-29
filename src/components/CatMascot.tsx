import homepageImage from "../../images/homepage.png";

export function CatMascot({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`relative mx-auto overflow-hidden ${
        compact ? "h-24 w-40" : "h-[210px] w-[252px]"
      }`}
      aria-label="Cute cat illustration"
      role="img"
    >
      <img
        src={homepageImage.src}
        alt=""
        className="h-full w-full object-cover object-center"
      />
    </div>
  );
}
