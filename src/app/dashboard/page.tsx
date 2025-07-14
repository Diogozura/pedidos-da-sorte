// app/dashboard/page.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const user = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user === null) {
      router.push('/auth/login');
    }
  }, [user, router]);

  if (!user) return null;

  return <div>Bem-vindo ao Dashboard, {user.email}</div>;
}
