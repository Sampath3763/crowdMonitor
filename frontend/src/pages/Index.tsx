import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { AvailabilityCard } from "@/components/AvailabilityCard";
import { useNavigate } from "react-router-dom";
import { Eye, BarChart3, Users, Brain, Zap, Shield, LogIn } from "lucide-react";
import { useState, useEffect } from "react";
import { useLiveData } from "@/contexts/LiveDataContext";

const Index = () => {
  const navigate = useNavigate();
  // Use real live data from context
  const { seats, tables, hasLiveData, currentPlaceId, setCurrentPlaceId } = useLiveData();
  const [places, setPlaces] = useState<any[]>([]);

  const API_URL = 'http://localhost:3001';

  // Fetch places from backend
  useEffect(() => {
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
          // Set first place as default selection if not already set
          if (placesWithId.length > 0 && !currentPlaceId) {
            setCurrentPlaceId(placesWithId[0].id);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching places:', error);
      }
    };
    fetchPlaces();
  }, [currentPlaceId, setCurrentPlaceId]);

  // Calculate real occupancy from live data
  const allSeats = hasLiveData ? [...seats, ...tables.flatMap((t: any) => t.seats)] : [];
  const totalSeats = allSeats.length;
  const occupiedSeats = allSeats.filter((s: any) => s.occupied).length;
  const availableSeats = totalSeats - occupiedSeats;
  const currentOccupancy = totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0;
  const status = currentOccupancy < 50 ? "available" : currentOccupancy < 75 ? "moderate" : "busy";

  // Get the current place name
  const currentPlace = places.find((p) => p.id === currentPlaceId);
  const placeName = currentPlace?.name || "Campus Cafeteria";

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-10" />
        <div className="container mx-auto px-4 py-20 relative">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
              CrowdMonitor
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              Never wait for a seat again. Check live cafeteria availability before you visit.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                size="lg"
                onClick={() => navigate("/login")}
                className="bg-gradient-hero text-primary-foreground hover:opacity-90 shadow-glow"
              >
                <LogIn className="mr-2 h-5 w-5" />
                Sign In
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/live-status")}
              >
                <Eye className="mr-2 h-5 w-5" />
                Quick View
              </Button>
            </div>

            {/* Live Preview Card - Shows Real Data from Manager Uploads */}
            {hasLiveData ? (
              <Card className="shadow-soft max-w-2xl mx-auto">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">{placeName}</h3>
                    <StatusBadge status={status} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <AvailabilityCard
                      title="Available Seats"
                      value={availableSeats}
                      subtitle={`${totalSeats} total`}
                      variant={status === "available" ? "success" : "warning"}
                    />
                    <AvailabilityCard
                      title="Current Occupancy"
                      value={`${currentOccupancy}%`}
                      subtitle="Live update"
                      variant="default"
                    />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-soft max-w-2xl mx-auto">
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      No live data available yet. Manager needs to upload place data to start monitoring.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/live-status")}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Go to Quick View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Smart Monitoring for Modern Cafeterias
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powered by AI to deliver real-time insights and predictive analytics
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="shadow-soft hover:shadow-glow transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-hero rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">AI-Powered Detection</h3>
                <p className="text-muted-foreground">
                  Advanced computer vision accurately tracks seat occupancy in real-time
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-soft hover:shadow-glow transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-available rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-6 w-6 text-success-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">Instant Updates</h3>
                <p className="text-muted-foreground">
                  Live seating data refreshed every few seconds for accurate information
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-soft hover:shadow-glow transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-busy rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-warning-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">Predictive Analytics</h3>
                <p className="text-muted-foreground">
                  Smart predictions based on historical data and current trends
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
              How It Works
            </h2>

            <div className="space-y-8">
              <div className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Check Availability</h3>
                  <p className="text-muted-foreground">
                    Open the app to see live seating status before heading to the cafeteria
                  </p>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">AI Processes Camera Feed</h3>
                  <p className="text-muted-foreground">
                    Our AI continuously monitors the seating layout and updates availability
                  </p>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Make Informed Decisions</h3>
                  <p className="text-muted-foreground">
                    Visit with confidence or choose an optimal time based on predictions
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border bg-muted/30">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 CrowdMonitor. Powered by AI for smarter campus dining.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
