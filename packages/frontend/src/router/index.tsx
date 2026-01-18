import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { Spinner, Center } from '@chakra-ui/react';
import ProtectedRoute from '../components/ProtectedRoute';
import AppLayout from '../components/AppLayout';

// Loading spinner component for lazy-loaded routes
const LoadingSpinner = () => (
  <Center h="100vh">
    <Spinner size="xl" color="primary.500" thickness="4px" />
  </Center>
);

// Lazy-loaded route components
const Dashboard = lazy(() => import('../pages/Dashboard'));
const AuthPage = lazy(() => import('../pages/AuthPage'));
const ActiveWorkout = lazy(() => import('../pages/ActiveWorkout'));
const WorkoutHistory = lazy(() => import('../pages/WorkoutHistory'));
const WorkoutDetail = lazy(() => import('../pages/WorkoutDetail'));
const ExerciseLibrary = lazy(() => import('../pages/ExerciseLibrary/ExerciseLibraryPage'));

// Router configuration
const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <AuthPage />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout>
          <Outlet />
        </AppLayout>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <Dashboard />
          </Suspense>
        ),
      },
      {
        path: 'workout/:id',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <ActiveWorkout />
          </Suspense>
        ),
      },
      {
        path: 'history',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <WorkoutHistory />
          </Suspense>
        ),
      },
      {
        path: 'history/:id',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <WorkoutDetail />
          </Suspense>
        ),
      },
      {
        path: 'exercises',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <ExerciseLibrary />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default router;
