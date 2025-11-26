import { ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { swrConfig } from '../api/client';

interface SWRProviderProps {
  children: ReactNode;
}

/**
 * SWR Provider Component
 * Wraps the app with SWR configuration
 */
function SWRProvider({ children }: SWRProviderProps) {
  return <SWRConfig value={swrConfig}>{children}</SWRConfig>;
}

export default SWRProvider;
