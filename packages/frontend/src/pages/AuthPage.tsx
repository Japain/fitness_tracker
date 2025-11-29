import { Box, Heading, Text, Button, VStack, HStack, Flex, Icon } from '@chakra-ui/react';

/**
 * Authentication/Login Page
 * Implements Google OAuth authentication flow
 * Design reference: mockups/html/06-authentication.html
 */
function AuthPage() {
  const handleGoogleLogin = () => {
    // Redirect to backend Google OAuth endpoint
    window.location.href = '/api/auth/google';
  };

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      px="lg"
      bgGradient="linear(135deg, primary.500, purple.600)"
    >
      <Box
        bg="white"
        p={{ base: '3xl', md: '3xl' }}
        borderRadius="md"
        boxShadow="lg"
        maxW="400px"
        w="full"
        textAlign="center"
      >
        {/* Logo and Brand */}
        <HStack spacing="md" justify="center" mb="md">
          <Icon viewBox="0 0 24 24" boxSize="48px" color="primary.500">
            <path
              fill="currentColor"
              d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"
            />
          </Icon>
          <Heading size="lg" color="primary.500">
            FitTrack
          </Heading>
        </HStack>

        {/* Page Title */}
        <Heading size="md" mb="md" color="neutral.900">
          Welcome Back!
        </Heading>

        {/* Subtitle */}
        <Text color="neutral.600" mb="3xl" lineHeight="relaxed">
          Log your workouts in under 30 seconds and track your fitness journey.
        </Text>

        {/* Google OAuth Button */}
        <Button
          w="full"
          h="56px"
          bg="white"
          border="2px solid"
          borderColor="neutral.700"
          borderRadius="md"
          fontSize="md"
          fontWeight="semibold"
          _hover={{
            bg: 'neutral.50',
            boxShadow: 'lg',
          }}
          onClick={handleGoogleLogin}
          leftIcon={
            <Icon viewBox="0 0 24 24" boxSize="24px">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </Icon>
          }
        >
          Continue with Google
        </Button>

        {/* Divider */}
        <Flex align="center" my="2xl">
          <Box flex="1" height="1px" bg="neutral.600" opacity="0.2" />
          <Text px="lg" color="neutral.600" fontSize="sm">
            or
          </Text>
          <Box flex="1" height="1px" bg="neutral.600" opacity="0.2" />
        </Flex>

        {/* Features List */}
        <VStack spacing="lg" align="stretch">
          <FeatureItem text="Quick 30-second workout logging" />
          <FeatureItem text="Track progress over time" />
          <FeatureItem text="60+ pre-loaded exercises" />
          <FeatureItem text="Your data stays private & secure" />
        </VStack>
      </Box>
    </Flex>
  );
}

interface FeatureItemProps {
  text: string;
}

function FeatureItem({ text }: FeatureItemProps) {
  return (
    <HStack spacing="md" align="center">
      <Icon viewBox="0 0 24 24" boxSize="20px" color="primary.500" flexShrink={0}>
        <path
          fill="currentColor"
          d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"
        />
      </Icon>
      <Text color="neutral.700" fontSize="md" textAlign="left">
        {text}
      </Text>
    </HStack>
  );
}

export default AuthPage;
