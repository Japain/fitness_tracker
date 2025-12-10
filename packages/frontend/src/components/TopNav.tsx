import { Box, Flex, Icon } from '@chakra-ui/react';
import type { User } from '@fitness-tracker/shared';

interface TopNavProps {
  user: User | null;
}

/**
 * TopNav Component
 * Design reference: mockups/html/01-dashboard-home.html lines 404-414
 *
 * Features:
 * - Sticky positioning at top (stays visible on scroll)
 * - Left side: Dumbbell icon + "FitTrack" brand name (both primary.500 color)
 * - Right side: User avatar with initials and gradient background
 * - Clean white background with border and shadow
 */
function TopNav({ user }: TopNavProps) {
  // Get user initials from displayName (e.g., "John Doe" -> "JD")
  const getInitials = (name: string | undefined): string => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <Box
      as="header"
      bg="white"
      borderBottom="1px"
      borderColor="neutral.200"
      px="lg"
      py="lg"
      boxShadow="sm"
      position="sticky"
      top={0}
      zIndex={100}
    >
      <Flex justify="space-between" align="center">
        {/* Left: Logo + Brand Name */}
        <Flex align="center" gap="sm" color="primary.500">
          {/* Dumbbell Icon - from mockup line 406-408 */}
          <Icon viewBox="0 0 24 24" boxSize="24px" aria-label="FitTrack logo">
            <path
              fill="currentColor"
              d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"
            />
          </Icon>
          <Box fontSize="lg" fontWeight="bold">
            FitTrack
          </Box>
        </Flex>

        {/* Right: User Avatar */}
        <Flex
          align="center"
          justify="center"
          w="40px"
          h="40px"
          borderRadius="full"
          bgGradient="linear(135deg, primary.500, primary.600)"
          color="white"
          fontWeight="semibold"
          fontSize="sm"
        >
          {getInitials(user?.displayName)}
        </Flex>
      </Flex>
    </Box>
  );
}

export default TopNav;
