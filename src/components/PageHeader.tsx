import Link from "next/link";
import { ArrowLeft, Bell, Search, X } from "lucide-react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  backHref?: string;
  action?: "search" | "close" | "bell";
};

export function PageHeader({ title, subtitle, backHref, action }: PageHeaderProps) {
  const ActionIcon = action === "close" ? X : action === "bell" ? Bell : Search;

  return (
    <header className="flex items-center justify-between px-5 pb-4 pt-6">
      <div className="flex min-w-0 items-center gap-3">
        {backHref ? (
          <Link
            href={backHref}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/55 text-paw-ink"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </Link>
        ) : null}
        <div className="min-w-0">
          <h1 className="truncate text-xl font-black leading-tight text-paw-ink">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-xs font-bold text-paw-cocoa/70">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {action ? (
        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-full bg-white/55 text-paw-ink"
          aria-label={action}
        >
          <ActionIcon size={19} />
        </button>
      ) : null}
    </header>
  );
}
