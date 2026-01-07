import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

interface Seat {
  id: string;
  occupied: boolean;
}

interface Table {
  id: string;
  seats: Seat[];
}

interface LiveDataContextType {
  seats: Seat[];
  tables: Table[];
  lastUpdate: Date;
  hasLiveData: boolean;
  currentPlaceId: string | null;
  setCurrentPlaceId: (placeId: string) => void;
  refreshData: () => void;
}

const LiveDataContext = createContext<LiveDataContextType | undefined>(undefined);

// Backend API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export function LiveDataProvider({ children }: { children: ReactNode }) {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [hasLiveData, setHasLiveData] = useState(false);
  const [currentPlaceId, setCurrentPlaceId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch live data for a specific place
  const fetchLiveData = async (placeId: string) => {
    if (!placeId) return;
    
    try {
      const response = await fetch(`${API_URL}/api/live-data/${placeId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.notInitialized) {
          // No media has been uploaded for this place yet
          setSeats([]);
          setTables([]);
          setLastUpdate(null);
          setHasLiveData(false);
          console.log('ℹ️ Live data not initialized for this place');
        } else {
          setSeats(data.seats || []);
          setTables(data.tables || []);
          setLastUpdate(data.lastUpdate ? new Date(data.lastUpdate) : new Date());
          setHasLiveData(true);
          console.log('✅ Loaded live data from backend');
          console.log('📊 Data timestamp:', data.lastUpdate);
          console.log('📊 Occupied seats:', (data.seats || []).filter((s: any) => s.occupied).length, '/', (data.seats || []).length);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching live data:', error);
      // Do not fabricate temporary data when backend unavailable; keep empty state
      setSeats([]);
      setTables([]);
      setLastUpdate(null);
      setHasLiveData(false);
    }
  };

  // Initialize Socket.IO connection
  useEffect(() => {
    // Initialize Socket.IO connection
    socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('✅ Connected to backend via WebSocket');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from backend');
      setIsConnected(false);
    });

    // Listen for live data updates from server
    socket.on('liveDataUpdated', (data) => {
      // Only update if it's for the current place
      console.log('🔄 Received liveDataUpdated event from server', data?.placeId);
      if (data.placeId === currentPlaceId) {
        console.log('🔄 Applying live data update for current place');
        setSeats(data.seats || []);
        setTables(data.tables || []);
        setLastUpdate(data.lastUpdate ? new Date(data.lastUpdate) : new Date());
        setHasLiveData(true);
      } else {
        // If update is for a different place, no-op here. But if the server sent updated live data
        // for the place currently being viewed, we'll fetch fresh data. This protects against
        // mismatched id formats and ensures freshness.
        if (currentPlaceId) {
          // If the server updated the place resource (e.g. image changed), a separate 'placesUpdated'
          // event may be emitted; we also listen for that below. For safety, if the incoming data
          // matches the currentPlaceId in string form, attempt to apply it.
          if (String(data.placeId) === String(currentPlaceId)) {
            setSeats(data.seats || []);
            setTables(data.tables || []);
            setLastUpdate(data.lastUpdate ? new Date(data.lastUpdate) : new Date());
            setHasLiveData(true);
          }
        }
      }
    });

    // Listen for place metadata updates (image/url changes)
    socket.on('placesUpdated', (payload) => {
      try {
        // payload may be { action, place } or { action, placeId }
        const updatedPlace = payload?.place;
        const updatedId = updatedPlace?._id || updatedPlace?.id || payload?.placeId;
        console.log('🔔 Received placesUpdated event for', updatedId, 'action=', payload?.action);
        // If a place was deleted, and it is the currently selected place, clear live data and selection
        if (payload?.action === 'deleted' && payload?.placeId) {
          if (currentPlaceId && String(payload.placeId) === String(currentPlaceId)) {
            console.log('🗑️ Currently selected place was deleted — clearing live data and selection');
            setSeats([]);
            setTables([]);
            setLastUpdate(null);
            setHasLiveData(false);
            setCurrentPlaceId(null);
          }
          return;
        }

        if (updatedId && currentPlaceId && String(updatedId) === String(currentPlaceId)) {
          // Re-fetch live data for the current place to ensure we have the latest analyzed data
          fetchLiveData(currentPlaceId);
        }
      } catch (err) {
        console.error('Error handling placesUpdated event:', err);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });

    // Listen for forced refresh requests from server (e.g., after analysis completes)
    socket.on('forceRefresh', (data) => {
      try {
        const placeId = data?.placeId;
        if (placeId && currentPlaceId && String(placeId) === String(currentPlaceId)) {
          console.log('🔁 Received forceRefresh for current place — re-fetching live data');
          fetchLiveData(currentPlaceId);
        }
      } catch (err) {
        console.error('Error handling forceRefresh event:', err);
      }
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, []);

  // Fetch data when place changes
  useEffect(() => {
    if (currentPlaceId) {
      fetchLiveData(currentPlaceId);
    }
  }, [currentPlaceId]);

  // Manual refresh function - simply re-fetch existing data
  const refreshData = async () => {
    if (!currentPlaceId) {
      console.log('⚠️ No place selected');
      return;
    }
    
    console.log('🔄 Refreshing data (fetching existing data from database)');
    // Simply re-fetch the existing data
    await fetchLiveData(currentPlaceId);
  };

  const value: LiveDataContextType = {
    seats,
    tables,
    lastUpdate: (lastUpdate as Date) || new Date(0),
    hasLiveData,
    currentPlaceId,
    setCurrentPlaceId,
    refreshData,
  };

  return <LiveDataContext.Provider value={value}>{children}</LiveDataContext.Provider>;
}

export function useLiveData() {
  const context = useContext(LiveDataContext);
  if (context === undefined) {
    throw new Error('useLiveData must be used within a LiveDataProvider');
  }
  return context;
}
