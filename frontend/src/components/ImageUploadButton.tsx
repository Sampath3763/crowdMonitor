import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ImagePlus, Upload, Link } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Place } from '@/types/auth';
import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export function ImageUploadButton() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('file');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      }
    } catch (error) {
      console.error('❌ Error fetching places:', error);
    }
  };

  // Initialize Socket.IO
  useEffect(() => {
    fetchPlaces();

    if (!socket) {
      socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', () => {
        console.log('🔌 Image Upload Button: Socket.IO connected');
      });

      socket.on('placesUpdated', () => {
        console.log('🔄 Places updated via Socket.IO');
        fetchPlaces();
      });

      socket.on('disconnect', () => {
        console.log('🔌 Image Upload Button: Socket.IO disconnected');
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image file (JPEG, PNG, GIF, or WebP).',
          variant: 'destructive',
        });
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select an image smaller than 5MB.',
          variant: 'destructive',
        });
        return;
      }

      setSelectedFile(file);
      
      // Generate preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlaceId) {
      toast({
        title: 'Please select a place',
        description: 'You must select a place to upload an image.',
        variant: 'destructive',
      });
      return;
    }

    if (uploadMethod === 'file' && !selectedFile) {
      toast({
        title: 'Please select a file',
        description: 'You must select an image file to upload.',
        variant: 'destructive',
      });
      return;
    }

    if (uploadMethod === 'url' && !imageUrl.trim()) {
      toast({
        title: 'Please enter an image URL',
        description: 'You must provide an image URL.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (uploadMethod === 'file' && selectedFile) {
        // Upload file
        const formData = new FormData();
        formData.append('image', selectedFile);

        const response = await fetch(`${API_URL}/api/places/${selectedPlaceId}/upload-image`, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          toast({
            title: 'Image uploaded',
            description: 'The image has been uploaded successfully.',
          });
          resetForm();
        } else {
          const error = await response.json();
          throw new Error(error.error || 'Failed to upload image');
        }
      } else {
        // Upload URL
        const response = await fetch(`${API_URL}/api/places/${selectedPlaceId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageUrl: imageUrl.trim(),
          }),
        });

        if (response.ok) {
          toast({
            title: 'Image uploaded',
            description: 'The image has been uploaded successfully.',
          });
          resetForm();
        } else {
          throw new Error('Failed to upload image');
        }
      }
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedPlaceId('');
    setImageUrl('');
    setSelectedFile(null);
    setPreviewUrl('');
    setIsOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    fetchPlaces();
  };

  const selectedPlace = places.find((p) => p.id === selectedPlaceId);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        size="icon"
        variant="outline"
        className="relative"
        title="Upload Image"
      >
        <ImagePlus className="h-5 w-5" />
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Place Image</DialogTitle>
            <DialogDescription>
              Select a place and upload an image file or provide an image URL.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4">
              {/* Place Selector */}
              <div className="grid gap-2">
                <Label htmlFor="place">Select Place</Label>
                <Select
                  value={selectedPlaceId}
                  onValueChange={setSelectedPlaceId}
                >
                  <SelectTrigger id="place">
                    <SelectValue placeholder="Choose a place" />
                  </SelectTrigger>
                  <SelectContent>
                    {places.map((place) => (
                      <SelectItem key={place.id} value={place.id}>
                        {place.name} - Capacity: {place.capacity}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Current Place Info */}
              {selectedPlace && (
                <div className="rounded-lg border p-3 bg-muted/50">
                  <p className="text-sm font-medium">{selectedPlace.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedPlace.description}
                  </p>
                  {selectedPlace.imageUrl && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-1">Current Image:</p>
                      <img
                        src={selectedPlace.imageUrl.startsWith('/uploads/') 
                          ? `${API_URL}${selectedPlace.imageUrl}` 
                          : selectedPlace.imageUrl}
                        alt={selectedPlace.name}
                        className="w-full h-32 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Upload Method Tabs */}
              <Tabs value={uploadMethod} onValueChange={(v) => setUploadMethod(v as 'url' | 'file')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="file" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Upload File
                  </TabsTrigger>
                  <TabsTrigger value="url" className="flex items-center gap-2">
                    <Link className="h-4 w-4" />
                    Image URL
                  </TabsTrigger>
                </TabsList>

                {/* File Upload Tab */}
                <TabsContent value="file" className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="fileUpload">Select Image File</Label>
                    <Input
                      id="fileUpload"
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleFileSelect}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground">
                      Supported formats: JPEG, PNG, GIF, WebP (Max 5MB)
                    </p>
                  </div>

                  {selectedFile && previewUrl && (
                    <div className="rounded-lg border p-3 bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">
                        Preview: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                      </p>
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded"
                      />
                    </div>
                  )}
                </TabsContent>

                {/* URL Tab */}
                <TabsContent value="url" className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="imageUrl">Image URL</Label>
                    <Input
                      id="imageUrl"
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  {imageUrl && (
                    <div className="rounded-lg border p-3 bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Image Preview:</p>
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.src = '';
                          e.currentTarget.alt = 'Invalid image URL';
                          e.currentTarget.className = 'w-full h-32 flex items-center justify-center bg-muted rounded text-xs text-muted-foreground';
                        }}
                      />
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                  resetForm();
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Uploading...' : 'Upload Image'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
