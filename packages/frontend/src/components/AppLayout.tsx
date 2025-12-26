import { ReactNode } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import TopNav from './TopNav';
import BottomNav from './BottomNav';

interface AppLayoutProps {
  children: ReactNode;
}

/**
 * AppLayout component
 * Main layout wrapper with TopNav and BottomNav
 * Shared across all authenticated pages
 *
 * Note: BottomNav is hidden on active workout pages because they have
 * their own fixed bottom action bar (Add Exercise + Finish buttons)
 */
function AppLayout({ children }: AppLayoutProps) {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  // Hide BottomNav on active workout pages (they have their own bottom actions)
  const isActiveWorkoutPage = location.pathname.startsWith('/workout/');

  return (
    <Flex direction="column" minH="100vh" bg="neutral.50">
      {/* Top Navigation */}
      <TopNav user={user} />

      {/* Main content area */}
      <Box as="main" flex="1" overflow="auto">
        {children}
      </Box>

      {/* Bottom Navigation - hidden on active workout pages */}
      {!isActiveWorkoutPage && <BottomNav />}
    </Flex>
  );
}

export default AppLayout;
