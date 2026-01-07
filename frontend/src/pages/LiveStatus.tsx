import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SeatingLayout } from "@/components/SeatingLayout";
import { TableView } from "@/components/TableView";
import { AvailabilityCard } from "@/components/AvailabilityCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useLiveData } from "@/contexts/LiveDataContext";
import { Place } from "@/types/auth";
import { Users, Clock, TrendingUp, Grid3x3, CircleDot, MapPin } from "lucide-react";
import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

let socket: Socket | null = null;

const LiveStatus = () => {
  // Use shared live data context - this ensures all users see the same data
  const { seats, tables, lastUpdate, hasLiveData, refreshData, currentPlaceId, setCurrentPlaceId } = useLiveData();
  
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [places, setPlaces] = useState<Place[]>([]);

  // Fetch places from backend
  const fetchPlaces = async () => {
    try {
      const response = await fetch(`${API_URL}/api/places`);
      if (response.ok) {
        const data = await response.json();
        const placesWithId = data.map((place: any) => ({
          ...place,
          id: place._id,
        }));
        setPlaces(placesWithId);
        // Set first place as default selection
        if (placesWithId.length > 0 && !currentPlaceId) {
          setCurrentPlaceId(placesWithId[0].id);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching places:', error);
    }
  };

  useEffect(() => {
    fetchPlaces();

    // Initialize Socket.IO for real-time place updates
    if (!socket) {
      socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', () => {
        console.log('🔌 LiveStatus: Socket.IO connected');
      });

      socket.on('placesUpdated', () => {
        console.log('🔄 LiveStatus: Places updated, refreshing list...');
        fetchPlaces();
      });

      socket.on('disconnect', () => {
        console.log('🔌 LiveStatus: Socket.IO disconnected');
      });
    }

    return () => {
      if (socket) {
        socket.off('connect');
        socket.off('placesUpdated');
        socket.off('disconnect');
      }
    };
  }, []);

  // Calculate stats from current view
  const getAllSeats = () => {
    if (viewMode === "grid") {
      return seats;
    } else {
      return tables.flatMap((table) => table.seats);
    }
  };

  const allSeats = hasLiveData ? getAllSeats() : [];
  const availableSeats = allSeats.filter((s) => !s.occupied).length;
  const totalSeats = allSeats.length;
  const occupancyRate = totalSeats > 0 ? ((totalSeats - availableSeats) / totalSeats) * 100 : 0;

  const getStatus = () => {
    if (occupancyRate <= 50) return "available";
    if (occupancyRate <= 75) return "moderate";
    if (occupancyRate <= 90) return "busy";
    return "full";
  };

  const getEstimatedWait = () => {
    if (occupancyRate < 30) return "0 min";
    if (occupancyRate < 50) return "~2 min";
    if (occupancyRate < 70) return "~5 min";
    if (occupancyRate < 85) return "~8 min";
    if (occupancyRate < 95) return "~12 min";
    return "~15+ min";
  };

  const lastUpdatedText = hasLiveData && lastUpdate ? lastUpdate.toLocaleTimeString() : 'No live data';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-hero bg-clip-text text-transparent">
                Live Seating Status
              </h1>
              <p className="text-muted-foreground">
                Last updated: {lastUpdatedText}
              </p>
            </div>
            <StatusBadge status={getStatus()} />
          </div>

          {/* Place Selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Select Monitoring Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              {places.length > 0 ? (
                <Select value={currentPlaceId || ""} onValueChange={setCurrentPlaceId}>
                  <SelectTrigger className="w-full md:w-[400px]">
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                  <SelectContent>
                    {places.map((place) => (
                      <SelectItem key={place.id} value={place.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{place.name}</span>
                          <span className="text-sm text-muted-foreground">
                            Capacity: {place.capacity} seats
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No monitoring locations available. Manager needs to add places first.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <AvailabilityCard
            title="Available Seats"
            value={availableSeats}
            subtitle={`${totalSeats} total seats`}
            icon={<Users />}
            variant={occupancyRate < 50 ? "success" : occupancyRate < 75 ? "warning" : "destructive"}
          />
          <AvailabilityCard
            title="Occupancy Rate"
            value={`${occupancyRate.toFixed(0)}%`}
            subtitle="Current capacity"
            icon={<TrendingUp />}
            variant="default"
          />
          <AvailabilityCard
            title="Estimated Wait"
            value={getEstimatedWait()}
            subtitle="For next available seat"
            icon={<Clock />}
            variant="default"
          />
        </div>

        <Card className="shadow-soft">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Seating Layout</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Green = Available • Red = Occupied
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3x3 className="h-4 w-4 mr-2" />
                  Grid View
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                >
                  <CircleDot className="h-4 w-4 mr-2" />
                  Table View
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === "grid" ? (
              <SeatingLayout seats={seats} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-4">
                {tables.map((table) => (
                  <div key={table.id} className="flex justify-center">
                    <TableView
                      tableId={table.id}
                      seats={table.seats}
                      totalSeats={table.seats.length}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LiveStatus;
