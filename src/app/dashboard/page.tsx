// app/dashboard/page.tsx
'use client';

import DashboardCard from '@/components/DashboardCard';
import { useAuth } from '@/context/AuthContext';
import {  CircularProgress, Container, Grid, Typography } from '@mui/material';


import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import BaseDash from './base';


export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!loading && !user) {
        router.push('/auth/login');
      }
    }

  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography>Verificando acesso...</Typography>
      </Container>
    );
  }
 


  return (
    <BaseDash>
      {/* Conteúdo */}
      <Container sx={{ mt: 6 }}>
        <Typography variant="h4" gutterBottom>
          Bem-vindo ao seu painel 🎉
        </Typography>

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 4 }} >
            <DashboardCard
              title="🎯 Raspadinhas Ativas"
              description="Visualize e gerencie todas as raspadinhas disponíveis no momento."
              onClick={() => router.push('/dashboard/ativas')}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <DashboardCard
              title="➕ Criar Raspadinha"
              description="Crie uma nova campanha de raspadinha personalizada."
              onClick={() => router.push('/dashboard/criar-sorteio')}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <DashboardCard
              title="➕ Promoções"
              description="Crie uma nova campanha de raspadinha personalizada."
              onClick={() => router.push('/dashboard/promocoes')}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <DashboardCard
              title="👤 Gerenciar Conta"
              description="Atualize seus dados, senha e preferências de conta."
              onClick={() => router.push('/dashboard/conta')}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <DashboardCard
              title="👤 Envio de código"
              description="Envio de códigos para participantes , no whatsApp"
              onClick={() => router.push('/dashboard/enviar')}
            />
          </Grid>
        </Grid>
      </Container>
    </BaseDash>

  )
}
