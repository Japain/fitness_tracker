import { useState, useEffect } from 'react';
import { Alert, AlertIcon, Text, Box } from '@chakra-ui/react';

/**
 * NetworkStatusBanner
 * Shows a sticky alert banner at the top of the page when the user is offline.
 * Listens to window online/offline events.
 */
export function NetworkStatusBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <Box position="sticky" top={0} zIndex={1000}>
      <Alert status="warning" borderRadius="0">
        <AlertIcon />
        <Text fontSize="sm">
          You're offline. Changes will sync when reconnected.
        </Text>
      </Alert>
    </Box>
  );
}
