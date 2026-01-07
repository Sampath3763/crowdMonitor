import { cn } from "@/lib/utils";

interface Seat {
  id: string;
  occupied: boolean;
}

interface TableViewProps {
  tableId: string;
  seats: Seat[];
  totalSeats: number;
  className?: string;
}

export const TableView = ({ tableId, seats, totalSeats, className }: TableViewProps) => {
  // Calculate position for each seat in a circle
  const getSeatPosition = (index: number, total: number) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2; // Start from top
    const radius = 45; // percentage
    const x = 50 + radius * Math.cos(angle);
    const y = 50 + radius * Math.sin(angle);
    return { x, y };
  };

  return (
    <div className={cn("relative w-full aspect-square max-w-[300px]", className)}>
      {/* Table Circle */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[70%] h-[70%] rounded-full bg-slate-800/50 border-2 border-slate-700 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-bold text-white">{tableId}</div>
            <div className="text-sm text-slate-400">{totalSeats} Seats</div>
          </div>
        </div>
      </div>

      {/* Seats positioned around the circle */}
      {seats.map((seat, index) => {
        const { x, y } = getSeatPosition(index, seats.length);
        return (
          <div
            key={seat.id}
            className="absolute w-8 h-8 transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <div
              className={cn(
                "w-full h-full rounded-full transition-all duration-300 border-2",
                seat.occupied
                  ? "bg-red-500 border-red-600 shadow-lg shadow-red-500/50"
                  : "bg-green-500 border-green-600 shadow-lg shadow-green-500/50"
              )}
              title={`Seat ${seat.id} - ${seat.occupied ? 'Occupied' : 'Available'}`}
            />
          </div>
        );
      })}
    </div>
  );
};
