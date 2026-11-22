'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export default function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  // Use a state to ensure the QueryClient is created only once on the client
  const [queryClient] = React.useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 300000, // 5 minutes
        gcTime: 1800000,   // 30 minutes
      },
    },
  }));

  React.useEffect(() => {
    const invalidate = () => { void queryClient.invalidateQueries({ queryKey: ['saved-career-context'] }); };
    window.addEventListener('xtara:learner-write', invalidate);
    return () => window.removeEventListener('xtara:learner-write', invalidate);
  }, [queryClient]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
