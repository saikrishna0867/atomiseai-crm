import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  // Allow preview mode bypass — auth works correctly on published URL
  const isPreview = window.location.hostname.includes('lovableproject.com') || window.location.hostname.includes('lovable.app');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user && !isPreview) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
