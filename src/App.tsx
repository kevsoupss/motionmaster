import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from './components/Login';
import { PoseComparisonProvider } from "./context/PoseComparisonContext";
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Analysis from "./pages/Analysis";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Upload from "./pages/Upload";

const queryClient = new QueryClient();

function AuthenticatedApp() {
  const { currentUser, logout } = useAuth();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <PoseComparisonProvider>
          <div className="min-h-screen">
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/analysis" element={<Analysis />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </div>
        </PoseComparisonProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthStateManager />
    </AuthProvider>
  );
}

function AuthStateManager() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>;
  }

  return currentUser ? <AuthenticatedApp /> : <Login />;
}

export default App;
