import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "available" | "moderate" | "busy" | "full";
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const variants = {
    available: "bg-success-light text-success border-success/20",
    moderate: "bg-success-light text-success border-success/20",
    busy: "bg-warning-light text-warning border-warning/20",
    full: "bg-destructive-light text-destructive border-destructive/20",
  };

  const labels = {
    available: "Available",
    moderate: "Moderate",
    busy: "Busy",
    full: "Full",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border transition-smooth",
        variants[status],
        className
      )}
    >
      <span className="w-2 h-2 rounded-full bg-current mr-2 animate-pulse" />
      {labels[status]}
    </span>
  );
};
