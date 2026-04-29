import Link from "next/link";
import { PawPrint } from "lucide-react";
import type { ReactNode } from "react";

type PrimaryButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "ghost" | "lavender";
  className?: string;
  icon?: ReactNode;
  type?: "button" | "submit";
};

const styles = {
  primary:
    "bg-gradient-to-r from-paw-pink to-paw-rose text-white shadow-soft hover:brightness-105",
  secondary:
    "border border-paw-cocoa/15 bg-white/55 text-paw-cocoa hover:bg-white",
  ghost: "text-paw-cocoa hover:bg-white/60",
  lavender: "bg-paw-lavender text-white shadow-soft hover:brightness-105"
};

export function PrimaryButton({
  children,
  href,
  variant = "primary",
  className = "",
  icon,
  type = "button"
}: PrimaryButtonProps) {
  const content = (
    <>
      <span>{children}</span>
      {icon ?? (variant === "primary" ? <PawPrint size={20} /> : null)}
    </>
  );
  const classes = `inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-extrabold transition ${styles[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} className={classes}>
      {content}
    </button>
  );
}
