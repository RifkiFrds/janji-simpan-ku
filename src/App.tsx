import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import BottomNavbar from "@/components/BottomNavbar";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Transaksi from "./pages/Transaksi";
import Rekening from "./pages/Rekening";
import Semester from "./pages/Semester";
import Analitik from "./pages/Analitik";
import Profil from "./pages/Profil";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppLayout() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="mx-auto max-w-lg px-4 pt-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transaksi" element={<Transaksi />} />
          <Route path="/rekening" element={<Rekening />} />
          <Route path="/semester" element={<Semester />} />
          <Route path="/analitik" element={<Analitik />} />
          <Route path="/profil" element={<Profil />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <BottomNavbar />
      {/* <PWAInstallPrompt /> */}
    </div>
  );
}

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary font-bold text-xl">JanjiKuMoney</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return <AppLayout />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
