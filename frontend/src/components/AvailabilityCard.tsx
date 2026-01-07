import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AvailabilityCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: "default" | "success" | "warning" | "destructive";
  className?: string;
}

export const AvailabilityCard = ({
  title,
  value,
  subtitle,
  icon,
  variant = "default",
  className,
}: AvailabilityCardProps) => {
  const variants = {
    default: "bg-card border-border",
    success: "bg-gradient-available border-success/20",
    warning: "bg-gradient-busy border-warning/20",
    destructive: "bg-gradient-full border-destructive/20",
  };

  const textVariants = {
    default: "text-card-foreground",
    success: "text-success-foreground",
    warning: "text-warning-foreground",
    destructive: "text-destructive-foreground",
  };

  return (
    <Card className={cn("overflow-hidden shadow-soft", variants[variant], className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className={cn("text-sm font-medium mb-1", 
              variant === "default" ? "text-muted-foreground" : textVariants[variant]
            )}>
              {title}
            </p>
            <p className={cn("text-3xl font-bold mb-1", textVariants[variant])}>
              {value}
            </p>
            {subtitle && (
              <p className={cn("text-xs", 
                variant === "default" ? "text-muted-foreground" : textVariants[variant]
              )}>
                {subtitle}
              </p>
            )}
          </div>
          {icon && (
            <div className={cn("text-2xl", textVariants[variant])}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
