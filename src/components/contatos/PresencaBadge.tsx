import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type Status = Database["public"]["Enums"]["status_presenca"];

const STATUS_CONFIG: Record<Status, { label: string; dotClass: string; textClass: string }> = {
  online: {
    label: "Online",
    dotClass: "bg-status-online",
    textClass: "text-status-online",
  },
  ocupado: {
    label: "Ocupado",
    dotClass: "bg-status-ocupado",
    textClass: "text-status-ocupado",
  },
  ausente: {
    label: "Ausente",
    dotClass: "bg-status-ausente",
    textClass: "text-status-ausente",
  },
  offline: {
    label: "Offline",
    dotClass: "bg-status-offline",
    textClass: "text-status-offline",
  },
};

export function PresencaBadge({ status, className }: { status: Status; className?: string }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs font-medium",
        cfg.textClass,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dotClass)} />
      {cfg.label}
    </span>
  );
}

export function PresencaDot({ status, className }: { status: Status; className?: string }) {
  return <span className={cn("h-2 w-2 rounded-full", STATUS_CONFIG[status].dotClass, className)} />;
}