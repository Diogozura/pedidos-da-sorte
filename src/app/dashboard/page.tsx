// app/dashboard/page.tsx
'use client';

import DashboardCard from '@/components/DashboardCard';
import ThemeToggleButton from '@/components/ThemeToggleButton';
import { useAuth } from '@/context/AuthContext';
import { AppBar, Box, Button,  CircularProgress,  Container, Grid, Toolbar, Typography } from '@mui/material';

import ProtectedRoute from '@/components/ProtectedRoute';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { logout } from '@/lib/logout';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
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
   const handleLogout = async () => {
    await logout();
    router.push('/');
  };


  return (
    <ProtectedRoute>
      {/* Header */}
      <AppBar position="static" sx={{ backgroundColor: '#BA0100' }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6">Bem-vindo, {user?.email}</Typography>
          <Box display="flex" gap={2}>
            <Button color="inherit" onClick={() => router.push('/dashboard')}>
              Dashboard
            </Button>
            <Button color="inherit" onClick={() => router.push('/dashboard/promocoes')}>
              Promoção
            </Button>
            <Button color="inherit" onClick={() => router.push('/dashboard/jogos')}>
              Jogos
            </Button>
            <Button color="inherit" onClick={handleLogout}>
              Sair
            </Button>
             <ThemeToggleButton />
          </Box>
        </Toolbar>
      </AppBar>

      {/* Conteúdo */}
      <Container sx={{ mt: 6 }}>
        <Typography variant="h4" gutterBottom>
          Bem-vindo ao seu painel 🎉
        </Typography>

        <Grid container spacing={4}>
          <Grid size={{xs:12, md:4}} >
            <DashboardCard
              title="🎯 Raspadinhas Ativas"
              description="Visualize e gerencie todas as raspadinhas disponíveis no momento."
              onClick={() => router.push('/dashboard/ativas')}
            />
          </Grid>
          <Grid size={{xs:12, md:4}}>
            <DashboardCard
              title="➕ Criar Raspadinha"
              description="Crie uma nova campanha de raspadinha personalizada."
              onClick={() => router.push('/dashboard/criar-sorteio')}
            />
          </Grid>
          <Grid size={{xs:12, md:4}}>
            <DashboardCard
              title="➕ Promoções"
              description="Crie uma nova campanha de raspadinha personalizada."
              onClick={() => router.push('/dashboard/promocoes')}
            />
          </Grid>
          <Grid size={{xs:12, md:4}}>
            <DashboardCard
              title="👤 Gerenciar Conta"
              description="Atualize seus dados, senha e preferências de conta."
              onClick={() => router.push('/dashboard/conta')}
            />
          </Grid>
        </Grid>
      </Container>
    </ProtectedRoute>

  )
}
