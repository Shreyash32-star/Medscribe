import { AudioLines } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-mic text-primary-foreground shadow-[var(--shadow-mic)]">
        <AudioLines className="h-5 w-5" />
      </div>
      <span className="text-lg font-bold tracking-tight text-navy">
        MedScribe<span className="text-primary"> AI</span>
      </span>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return status === "finalized" ? (
    <Badge className="border-transparent bg-success/15 text-success hover:bg-success/15">Finalized</Badge>
  ) : (
    <Badge className="border-transparent bg-warning-soft text-warning-foreground hover:bg-warning-soft">Draft</Badge>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
