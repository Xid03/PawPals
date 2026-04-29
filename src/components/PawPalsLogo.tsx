import logoImage from "../../images/logo.png";

export function PawPalsLogo({
  compact = false,
  className = ""
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`block overflow-hidden ${
        compact ? "h-9 w-28" : "h-[82px] w-[224px]"
      } ${className}`}
    >
      <img
        src={logoImage.src}
        alt="PawPals"
        className="h-full w-full object-cover object-center"
      />
    </span>
  );
}
