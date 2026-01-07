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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Video, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Place } from '@/types/auth';
import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export function VideoUploadButton() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPlaces = async () => {
    try {
      const response = await fetch(`${API_URL}/api/places`);
      if (response.ok) {
        const data = await response.json();
        const placesWithId = data.map((place: any) => ({ ...place, id: place._id }));
        setPlaces(placesWithId);
      }
    } catch (err) {
      console.error('Error fetching places for video upload:', err);
    }
  };

  useEffect(() => {
    fetchPlaces();
    if (!socket) {
      socket = io(SOCKET_URL);
      socket.on('placesUpdated', () => fetchPlaces());
    }
    return () => {
      if (socket) socket.off('placesUpdated');
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg'];
    if (!allowed.includes(file.type)) {
      toast({ title: 'Invalid file type', description: 'Please select an MP4/WebM/MOV/OGG video.', variant: 'destructive' });
      return;
    }
    if (file.size > 200 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please select a video smaller than 200MB.', variant: 'destructive' });
      return;
    }
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const resetForm = () => {
    setSelectedPlaceId('');
    setSelectedFile(null);
    setPreviewUrl('');
    setIsOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    fetchPlaces();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlaceId) return toast({ title: 'Select place', description: 'Choose a place first', variant: 'destructive' });
    if (!selectedFile) return toast({ title: 'Select file', description: 'Choose a video file', variant: 'destructive' });
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('video', selectedFile);
      const res = await fetch(`${API_URL}/api/places/${selectedPlaceId}/upload-video`, { method: 'POST', body: fd });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Upload failed');
      }
      toast({ title: 'Upload started', description: 'Video uploaded. Processing will run in background.' });
      resetForm();
    } catch (err: any) {
      console.error('Video upload error:', err);
      toast({ title: 'Error', description: err.message || 'Failed to upload video', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPlace = places.find(p => p.id === selectedPlaceId);

  return (
    <>
      <Button onClick={() => setIsOpen(true)} size="icon" variant="outline" title="Upload Video">
        <Video className="h-5 w-5" />
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Place Video</DialogTitle>
            <DialogDescription>Select a place and upload a short video for analysis.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="place">Select Place</Label>
                <Select value={selectedPlaceId} onValueChange={setSelectedPlaceId}>
                  <SelectTrigger id="place"><SelectValue placeholder="Choose a place" /></SelectTrigger>
                  <SelectContent>
                    {places.map(place => (
                      <SelectItem key={place.id} value={place.id}>{place.name} - {place.capacity} seats</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPlace && (
                <div className="rounded-lg border p-3 bg-muted/50">
                  <p className="text-sm font-medium">{selectedPlace.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{selectedPlace.description}</p>
                  {selectedPlace.videoUrl && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-1">Current Video:</p>
                      <video src={selectedPlace.videoUrl.startsWith('/uploads/') ? `${API_URL}${selectedPlace.videoUrl}` : selectedPlace.videoUrl} className="w-full h-40 object-cover rounded" controls muted playsInline onError={(e) => { (e.currentTarget as HTMLVideoElement).style.display = 'none'; }} />
                    </div>
                  )}
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="videoFile">Select Video File</Label>
                <Input id="videoFile" ref={fileInputRef} type="file" accept="video/*" onChange={handleFileSelect} />
                <p className="text-xs text-muted-foreground">Supported: MP4 / WebM / MOV / OGG. Max 200MB.</p>
              </div>

              {previewUrl && (
                <div className="rounded-lg border p-3 bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                  <video src={previewUrl} className="w-full h-48 object-cover rounded" controls muted playsInline />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setIsOpen(false); resetForm(); }} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Uploading...' : 'Upload Video'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default VideoUploadButton;
