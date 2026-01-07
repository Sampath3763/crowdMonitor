import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Eye, BarChart3, MapPin, LogOut, User, Shield } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ImageUploadButton } from '@/components/ImageUploadButton';
import VideoUploadButton from '@/components/VideoUploadButton';

export function NavigationHeader() {
  const navigate = useNavigate();
  const { user, logout, isManager } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1
              className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent cursor-pointer"
              onClick={() => navigate('/')}
            >
              CrowdMonitor
            </h1>
            <nav className="hidden md:flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/live-status')}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Live Status
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </Button>
              {isManager && (
                <Button
                  variant="ghost"
                  onClick={() => navigate('/manage-places')}
                  className="flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  Manage Places
                </Button>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isManager && <ImageUploadButton />}
            {isManager && <VideoUploadButton />}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarFallback className="bg-gradient-hero text-white">
                      {user ? getInitials(user.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    {isManager ? (
                      <Shield className="h-3 w-3 text-primary" />
                    ) : (
                      <User className="h-3 w-3 text-primary" />
                    )}
                    <span className="text-xs font-medium text-primary capitalize">
                      {user?.role}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/live-status')}>
                <Eye className="mr-2 h-4 w-4" />
                Live Status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Dashboard
              </DropdownMenuItem>
              {isManager && (
                <DropdownMenuItem onClick={() => navigate('/manage-places')}>
                  <MapPin className="mr-2 h-4 w-4" />
                  Manage Places
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
