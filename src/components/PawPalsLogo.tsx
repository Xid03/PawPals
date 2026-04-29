import logoImage from "../../images/logo.png";

export function PawPalsLogo({ compact = false }: { compact?: boolean }) {
  return (
    <img
      src={logoImage.src}
      alt="PawPals"
      className={`object-contain ${compact ? "h-9 w-28" : "h-24 w-64"}`}
    />
  );
}
