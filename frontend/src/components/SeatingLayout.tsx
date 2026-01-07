import { cn } from "@/lib/utils";

interface Seat {
  id: string;
  occupied: boolean;
}

interface SeatingLayoutProps {
  seats: Seat[];
  className?: string;
}

export const SeatingLayout = ({ seats, className }: SeatingLayoutProps) => {
  // Calculate optimal grid columns based on total seats
  const totalSeats = seats.length;
  if (totalSeats === 0) {
    return (
      <div className="w-full p-8 text-center text-sm text-muted-foreground">
        No live seating data yet. Manager must upload an image or video for this location.
      </div>
    );
  }
  const columns = Math.ceil(Math.sqrt(totalSeats));
  
  // Generate dynamic grid column class
  const gridColsClass = `grid-cols-${Math.min(columns, 12)}`; // Cap at 12 columns for large layouts
  
  return (
    <div 
      className={cn("grid gap-2", className)}
      style={{ 
        gridTemplateColumns: `repeat(${Math.min(columns, 12)}, minmax(0, 1fr))` 
      }}
    >
      {seats.map((seat) => (
        <div
          key={seat.id}
          className={cn(
            "aspect-square rounded-lg transition-all duration-300 flex items-center justify-center text-xs font-medium shadow-soft",
            seat.occupied
              ? "bg-destructive/10 border-2 border-destructive/30 text-destructive"
              : "bg-success/10 border-2 border-success/30 text-success hover:scale-105 cursor-pointer"
          )}
        >
          {seat.id}
        </div>
      ))}
    </div>
  );
};
