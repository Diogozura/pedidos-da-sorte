// components/ProtectedRoute.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { CircularProgress, Container, Typography } from '@mui/material';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!loading && !user) {
        router.push('/login');
      }
    }

  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <Container sx={{ mt: 6, textAlign: 'center' }}>
        <CircularProgress />
        <Typography>Verificando acesso...</Typography>
      </Container>
    );
  }

  return <>{children}</>;
}
