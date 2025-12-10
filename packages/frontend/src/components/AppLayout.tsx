import { ReactNode } from 'react';
import { Box, Flex } from '@chakra-ui/react';
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
 */
function AppLayout({ children }: AppLayoutProps) {
  const user = useAuthStore((state) => state.user);

  return (
    <Flex direction="column" minH="100vh" bg="neutral.50">
      {/* Top Navigation */}
      <TopNav user={user} />

      {/* Main content area */}
      <Box as="main" flex="1" overflow="auto">
        {children}
      </Box>

      {/* Bottom Navigation */}
      <BottomNav />
    </Flex>
  );
}

export default AppLayout;
