'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { OrganizationContextProvider } from '@/features/organizations/components/organization-context-provider';
import { AuthProvider } from '@/lib/auth/auth-context';
import { createQueryClient } from '@/lib/query/query-client';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OrganizationContextProvider>{children}</OrganizationContextProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
