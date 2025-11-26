import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import App from './App';
import theme from './theme';
import SWRProvider from './components/SWRProvider';
import { fetchCsrfToken } from './api/client';

// Initialize CSRF token before rendering app
fetchCsrfToken().catch((error) => {
  console.error('Failed to initialize CSRF token:', error);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChakraProvider theme={theme}>
      <SWRProvider>
        <App />
      </SWRProvider>
    </ChakraProvider>
  </StrictMode>
);
