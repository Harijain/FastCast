import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="glass-card flex flex-col items-center justify-center rounded-xl px-6 py-16 text-center">
      <div className="mb-4 rounded-full bg-white/[0.04] p-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-medium">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && (
        <Button onClick={action.onClick} className="mt-5">
          {action.label}
        </Button>
      )}
    </div>
  );
}