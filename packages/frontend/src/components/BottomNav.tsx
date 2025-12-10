import { Box, Flex, Icon } from '@chakra-ui/react';
import { Link, useLocation } from 'react-router-dom';

/**
 * BottomNav Component
 * Design reference: mockups/html/01-dashboard-home.html lines 512-538
 *
 * Features:
 * - Sticky positioning at bottom (stays visible on scroll)
 * - 4 navigation items: Home, History, Exercises, Profile
 * - Each item: Icon (24×24px) + label (12px text) in vertical stack
 * - Active state: primary.500 color
 * - Hover state: neutral.100 background
 * - Touch targets: minimum 52px height for mobile accessibility
 * - Uses React Router Link for client-side navigation
 */
function BottomNav() {
  const location = useLocation();

  const navItems = [
    {
      path: '/',
      label: 'Home',
      icon: (
        <path
          fill="currentColor"
          d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"
        />
      ),
    },
    {
      path: '/history',
      label: 'History',
      icon: (
        <path
          fill="currentColor"
          d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"
        />
      ),
    },
    {
      path: '/exercises',
      label: 'Exercises',
      icon: (
        <path
          fill="currentColor"
          d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"
        />
      ),
    },
    {
      path: '/profile',
      label: 'Profile',
      icon: (
        <path
          fill="currentColor"
          d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
        />
      ),
    },
  ];

  return (
    <Box
      as="nav"
      bg="white"
      borderTop="1px"
      borderColor="neutral.200"
      px="lg"
      py="md"
      boxShadow="0 -2px 8px rgba(0, 0, 0, 0.05)"
      position="sticky"
      bottom={0}
      zIndex={100}
    >
      <Flex justify="space-around" align="center">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <Box
              key={item.path}
              as={Link}
              to={item.path}
              display="flex"
              flexDirection="column"
              alignItems="center"
              gap="xs"
              color={isActive ? 'primary.500' : 'neutral.600'}
              fontSize="xs"
              p="sm"
              minW="60px"
              minH="52px"
              justifyContent="center"
              borderRadius="sm"
              transition="all 150ms ease-in-out"
              textDecoration="none"
              _hover={{
                bg: 'neutral.100',
              }}
            >
              <Icon viewBox="0 0 24 24" boxSize="24px" aria-hidden="true">
                {item.icon}
              </Icon>
              <Box as="span">{item.label}</Box>
            </Box>
          );
        })}
      </Flex>
    </Box>
  );
}

export default BottomNav;
