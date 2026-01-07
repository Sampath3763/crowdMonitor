import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react';
import { Place } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';
import { io, Socket } from 'socket.io-client';

// Backend API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

let socket: Socket | null = null;

const ManagePlaces = () => {
  const { toast } = useToast();
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: 0,
    imageUrl: '',
  });

  // Fetch places from backend
  const fetchPlaces = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/places`);
      if (response.ok) {
        const data = await response.json();
        // Convert MongoDB _id to id for frontend compatibility
        const placesWithId = data.map((place: any) => ({
          ...place,
          id: place._id,
        }));
        setPlaces(placesWithId);
        console.log('✅ Loaded places from backend');
      }
    } catch (error) {
      console.error('❌ Error fetching places:', error);
      toast({
        title: 'Error',
        description: 'Failed to load places. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize Socket.IO and fetch places
  useEffect(() => {
    // Fetch initial places
    fetchPlaces();

    // Initialize Socket.IO connection
    socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('✅ Connected to backend for places sync');
    });

    // Listen for places updates from server
    socket.on('placesUpdated', (data) => {
      console.log('🔄 Received places update:', data.action);
      // Refresh places list
      fetchPlaces();
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from backend');
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, []);

  const handleOpenDialog = (place?: Place) => {
    if (place) {
      setEditingPlace(place);
      setFormData({
        name: place.name,
        description: place.description,
        capacity: place.capacity,
        imageUrl: place.imageUrl || '',
      });
    } else {
      setEditingPlace(null);
      setFormData({
        name: '',
        description: '',
        capacity: 0,
        imageUrl: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingPlace) {
        // Update existing place
        const response = await fetch(`${API_URL}/api/places/${editingPlace.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            capacity: formData.capacity,
            imageUrl: formData.imageUrl,
          }),
        });

        if (response.ok) {
          toast({
            title: 'Place updated',
            description: 'The monitoring location has been updated successfully.',
          });
          fetchPlaces(); // Refresh the list
        } else {
          throw new Error('Failed to update place');
        }
      } else {
        // Add new place
        const response = await fetch(`${API_URL}/api/places`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            capacity: formData.capacity,
            imageUrl: formData.imageUrl,
          }),
        });

        if (response.ok) {
          toast({
            title: 'Place added',
            description: 'New monitoring location has been added successfully.',
          });
          fetchPlaces(); // Refresh the list
        } else {
          throw new Error('Failed to add place');
        }
      }

      setIsDialogOpen(false);
      setEditingPlace(null);
    } catch (error) {
      console.error('Error saving place:', error);
      toast({
        title: 'Error',
        description: 'Failed to save place. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/api/places/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Place deleted',
          description: 'The monitoring location has been removed.',
        });
        fetchPlaces(); // Refresh the list
      } else {
        throw new Error('Failed to delete place');
      }
    } catch (error) {
      console.error('Error deleting place:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete place. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Manage Places</h2>
          <p className="text-muted-foreground">
            Add and manage locations for crowd monitoring
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add New Place
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingPlace ? 'Edit Place' : 'Add New Place'}
                </DialogTitle>
                <DialogDescription>
                  {editingPlace
                    ? 'Update the details of the monitoring location.'
                    : 'Add a new location to monitor crowd density.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Main Cafeteria"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Brief description of the location"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="capacity">Capacity *</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    value={formData.capacity || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        capacity: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="Maximum capacity"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                  <Input
                    id="imageUrl"
                    value={formData.imageUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, imageUrl: e.target.value })
                    }
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPlace ? 'Update' : 'Add'} Place
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Monitoring Locations
          </CardTitle>
          <CardDescription>
            Currently monitoring {places.length} location{places.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Loading places...</p>
            </div>
          ) : places.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No monitoring locations yet.</p>
              <p className="text-sm">Add your first location to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Capacity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {places.map((place) => (
                  <TableRow key={place.id}>
                    <TableCell>
                      {place.videoUrl ? (
                        // Show video preview when video is available
                        <video
                          src={place.videoUrl.startsWith('/uploads/') ? `${API_URL}${place.videoUrl}` : place.videoUrl}
                          className="w-16 h-16 object-cover rounded-lg"
                          controls
                          muted
                          playsInline
                        />
                      ) : place.imageUrl ? (
                        <img 
                          src={place.imageUrl.startsWith('/uploads/') 
                            ? `${API_URL}${place.imageUrl}` 
                            : place.imageUrl} 
                          alt={place.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                          <MapPin className="h-8 w-8 text-muted-foreground opacity-50" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{place.name}</TableCell>
                    <TableCell className="max-w-md truncate">
                      {place.description}
                    </TableCell>
                    <TableCell className="text-center">{place.capacity}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(place)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(place.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagePlaces;
