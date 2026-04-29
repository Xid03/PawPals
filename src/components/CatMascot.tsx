import homepageImage from "../../images/homepage.png";

export function CatMascot({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`relative mx-auto ${
        compact ? "h-24 w-40" : "h-44 w-72"
      }`}
      aria-label="Cute cat illustration"
      role="img"
    >
      <img
        src={homepageImage.src}
        alt=""
        className="h-full w-full object-contain"
      />
    </div>
  );
}
