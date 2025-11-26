import { ReactNode } from 'react';
import { Box, Flex } from '@chakra-ui/react';

interface AppLayoutProps {
  children: ReactNode;
}

/**
 * AppLayout component
 * Main layout wrapper with TopNav and BottomNav
 * Shared across all authenticated pages
 */
function AppLayout({ children }: AppLayoutProps) {
  return (
    <Flex direction="column" minH="100vh" bg="neutral.50">
      {/* TopNav - Placeholder for now */}
      <Box
        as="header"
        bg="white"
        borderBottom="1px"
        borderColor="neutral.200"
        px="lg"
        py="md"
        boxShadow="sm"
      >
        <Box fontWeight="bold" fontSize="lg" color="neutral.900">
          Fitness Tracker
        </Box>
      </Box>

      {/* Main content area */}
      <Box as="main" flex="1" overflow="auto">
        {children}
      </Box>

      {/* BottomNav - Placeholder for now */}
      <Box
        as="nav"
        bg="white"
        borderTop="1px"
        borderColor="neutral.200"
        px="lg"
        py="sm"
        boxShadow="md"
      >
        <Flex justify="space-around" align="center">
          <Box fontSize="xs" color="neutral.600" textAlign="center">
            Home
          </Box>
          <Box fontSize="xs" color="neutral.600" textAlign="center">
            Workout
          </Box>
          <Box fontSize="xs" color="neutral.600" textAlign="center">
            History
          </Box>
        </Flex>
      </Box>
    </Flex>
  );
}

export default AppLayout;
