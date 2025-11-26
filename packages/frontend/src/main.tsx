import { StrictMode, useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider, Alert, AlertIcon, AlertTitle, AlertDescription, Box } from '@chakra-ui/react';
import App from './App';
import theme from './theme';
import SWRProvider from './components/SWRProvider';
import { fetchCsrfToken } from './api/client';

function Root() {
  const [csrfError, setCsrfError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize CSRF token before rendering app
    fetchCsrfToken().catch((error) => {
      console.error('Failed to initialize CSRF token:', error);
      setCsrfError(error.message || 'Failed to initialize security token');
    });
  }, []);

  return (
    <StrictMode>
      <ChakraProvider theme={theme}>
        {csrfError && (
          <Box p="lg">
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle>Security Initialization Failed</AlertTitle>
                <AlertDescription>
                  Unable to connect to the server. Some features may not work correctly. Please refresh the page to try again.
                </AlertDescription>
              </Box>
            </Alert>
          </Box>
        )}
        <SWRProvider>
          <App />
        </SWRProvider>
      </ChakraProvider>
    </StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />);
