import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, Clock, MapPin, AlertCircle } from "lucide-react";
import { AvailabilityCard } from "@/components/AvailabilityCard";
import { Place } from "@/types/auth";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { io, Socket } from 'socket.io-client';

const API_URL = 'http://localhost:3001';
const SOCKET_URL = 'http://localhost:3001';

let socket: Socket | null = null;

interface PeakHour {
  time: string;
  occupancy: string;
}

interface TodayStats {
  avgOccupancy: number;
  peakTime: string;
  avgWaitTime: string;
  totalVisitors: number;
}

interface OccupancyData {
  placeId: string;
  placeName: string;
  peakHours: PeakHour[];
  todayStats: TodayStats;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<string>("");
  const [occupancyData, setOccupancyData] = useState<OccupancyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(true);

  // Fetch places
  const fetchPlaces = async () => {
    try {
      setIsLoadingPlaces(true);
      const response = await fetch(`${API_URL}/api/places`);
      if (response.ok) {
        const data = await response.json();
        const placesWithId = data.map((place: any) => ({
          ...place,
          id: place._id,
        }));
        setPlaces(placesWithId);
        // Set first place as default
        if (placesWithId.length > 0 && !selectedPlace) {
          setSelectedPlace(placesWithId[0].id);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching places:', error);
    } finally {
      setIsLoadingPlaces(false);
    }
  };

  // Fetch occupancy data for selected place
  const fetchOccupancyData = async () => {
    if (!selectedPlace) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/occupancy-history/${selectedPlace}`);
      if (response.ok) {
        const data = await response.json();
        setOccupancyData(data);
        console.log('✅ Loaded occupancy data for place');
      }
    } catch (error) {
      console.error('❌ Error fetching occupancy data:', error);
    } finally {
      setIsLoading(false);
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
        console.log('🔌 Dashboard: Socket.IO connected');
      });

      socket.on('placesUpdated', () => {
        console.log('🔄 Dashboard: Places updated, refreshing list...');
        fetchPlaces();
      });

      socket.on('liveDataUpdated', (data) => {
        console.log('🔄 Dashboard: Live data updated for place:', data?.placeId);
        // If the updated place matches current selection, refresh occupancy data
        if (data?.placeId === selectedPlace) {
          console.log('🔄 Dashboard: Refreshing occupancy data for current place');
          fetchOccupancyData();
        }
      });

      socket.on('disconnect', () => {
        console.log('🔌 Dashboard: Socket.IO disconnected');
      });
    }

    return () => {
      if (socket) {
        socket.off('connect');
        socket.off('placesUpdated');
        socket.off('liveDataUpdated');
        socket.off('disconnect');
      }
    };
  }, [selectedPlace]);

  // Fetch occupancy data when place changes
  useEffect(() => {
    fetchOccupancyData();
  }, [selectedPlace]);

  const peakHours = occupancyData?.peakHours || [];
  const todayStats = occupancyData?.todayStats ? {
    avgOccupancy: `${occupancyData.todayStats.avgOccupancy}%`,
    peakTime: occupancyData.todayStats.peakTime,
    avgWaitTime: occupancyData.todayStats.avgWaitTime,
    totalVisitors: occupancyData.todayStats.totalVisitors.toString(),
  } : {
    avgOccupancy: "0%",
    peakTime: "N/A",
    avgWaitTime: "0 min",
    totalVisitors: "0",
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-hero bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            Historical trends, peak times and occupancy insights
          </p>
        </div>

        {/* No Places Message */}
        {!isLoadingPlaces && places.length === 0 ? (
          <Card className="mb-8">
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Monitoring Locations Found</h3>
              <p className="text-muted-foreground mb-6">
                {user?.role === 'manager' 
                  ? "You haven't added any monitoring locations yet. Add your first location to start tracking occupancy data."
                  : "No monitoring locations are available yet. Please contact the administrator to set up monitoring locations."}
              </p>
              {user?.role === 'manager' && (
                <Button onClick={() => navigate('/manage-places')}>
                  <MapPin className="h-4 w-4 mr-2" />
                  Add Your First Location
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Place Selector */}
            <Card className="mb-8">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Select Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingPlaces ? (
                  <p className="text-sm text-muted-foreground">Loading locations...</p>
                ) : (
                  <Select value={selectedPlace} onValueChange={setSelectedPlace}>
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
                )}
              </CardContent>
            </Card>

            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading dashboard data...</p>
              </div>
            ) : occupancyData ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <AvailabilityCard
            title="Avg Occupancy"
            value={todayStats.avgOccupancy}
            subtitle="Today"
            icon={<TrendingUp />}
            variant="default"
          />
          <AvailabilityCard
            title="Peak Time"
            value={todayStats.peakTime}
            subtitle="Busiest hour"
            icon={<Clock />}
            variant="warning"
          />
          <AvailabilityCard
            title="Avg Wait Time"
            value={todayStats.avgWaitTime}
            subtitle="Per customer"
            icon={<Clock />}
            variant="default"
          />
          <AvailabilityCard
            title="Total Visitors"
            value={todayStats.totalVisitors}
            subtitle="Today"
            icon={<Users />}
            variant="success"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Peak Hours Analysis</CardTitle>
              <p className="text-sm text-muted-foreground">
                Highest occupancy periods this week
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {peakHours.map((hour, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted">
                    <span className="font-medium">{hour.time}</span>
                    <span className="text-lg font-bold text-primary">{hour.occupancy}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
              <p className="text-sm text-muted-foreground">
                AI-powered insights for optimization
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-success-light border border-success/20">
                  <p className="font-medium text-success mb-1">Add Staff During Peak</p>
                  <p className="text-sm text-muted-foreground">
                    Consider adding 2 more staff members between 12-1 PM
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-warning-light border border-warning/20">
                  <p className="font-medium text-warning mb-1">Optimize Table Layout</p>
                  <p className="text-sm text-muted-foreground">
                    4-seater tables are underutilized during lunch hours
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="font-medium text-primary mb-1">Promote Off-Peak Hours</p>
                  <p className="text-sm text-muted-foreground">
                    Offer discounts for 2-3 PM visits to balance demand
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
          </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No data available for this location yet.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
