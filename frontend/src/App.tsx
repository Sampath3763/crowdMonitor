import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { LiveDataProvider } from "./contexts/LiveDataContext";
import { ProtectedRoute, PublicRoute } from "./components/ProtectedRoute";
import { NavigationHeader } from "./components/NavigationHeader";
import { Chatbot } from "./components/Chatbot";
import Index from "./pages/Index";
import Login from "./pages/Login";
import LiveStatus from "./pages/LiveStatus";
import Dashboard from "./pages/Dashboard";
import ManagePlaces from "./pages/ManagePlaces";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Wrapper component to conditionally show navigation
const LayoutWrapper = ({ children, showNav = false }: { children: React.ReactNode; showNav?: boolean }) => (
  <>
    {showNav && <NavigationHeader />}
    {children}
    {showNav && <Chatbot />}
  </>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LiveDataProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />

            {/* Public quick view - no authentication required */}
            <Route
              path="/live-status"
              element={
                <LayoutWrapper showNav>
                  <LiveStatus />
                </LayoutWrapper>
              }
            />

            {/* Protected routes - require authentication */}

            {/* Protected routes - both user and manager */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <LayoutWrapper showNav>
                    <Dashboard />
                  </LayoutWrapper>
                </ProtectedRoute>
              }
            />

            {/* Manager-only routes */}
            <Route
              path="/manage-places"
              element={
                <ProtectedRoute requiredRole="manager">
                  <LayoutWrapper showNav>
                    <div className="container mx-auto px-4 py-8 max-w-7xl">
                      <ManagePlaces />
                    </div>
                  </LayoutWrapper>
                </ProtectedRoute>
              }
            />

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LiveDataProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
