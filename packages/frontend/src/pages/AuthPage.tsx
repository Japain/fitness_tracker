import { Box, Heading, Text, Button, Center, VStack } from '@chakra-ui/react';

/**
 * Authentication/Login Page
 * Displays Google OAuth button (stubbed for now)
 */
function AuthPage() {
  return (
    <Center minH="100vh" bg="neutral.50" px="lg">
      <VStack spacing="xl" maxW="400px" w="full">
        <Box textAlign="center">
          <Heading size="lg" mb="md">
            Fitness Tracker
          </Heading>
          <Text color="neutral.600">
            Track your workouts and monitor your progress
          </Text>
        </Box>
        <Button
          colorScheme="primary"
          size="lg"
          w="full"
          onClick={() => {
            // TODO: Implement Google OAuth when auth is set up
            console.log('Login clicked - OAuth to be implemented');
          }}
        >
          Sign in with Google
        </Button>
      </VStack>
    </Center>
  );
}

export default AuthPage;
