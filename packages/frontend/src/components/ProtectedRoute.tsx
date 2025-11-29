import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Center, Spinner } from '@chakra-ui/react';
import { useAuthStore } from '../stores/authStore';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * ProtectedRoute component
 * Protects routes that require authentication
 * Redirects to /login if user is not authenticated
 *
 * Note: Auth check is performed by App.tsx on mount,
 * so we only need to check the current state here.
 */
function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuthStore();

  // Show loading spinner while initial auth check is in progress
  if (isLoading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="primary.500" thickness="4px" aria-label="Checking authentication" />
      </Center>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
