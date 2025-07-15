// app/dashboard/page.tsx
'use client';

import DashboardCard from '@/components/DashboardCard';
import ThemeToggleButton from '@/components/ThemeToggleButton';
import { useAuth } from '@/context/AuthContext';
import { AppBar, Box, Button,  Container, Grid, Toolbar, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  // const user = useAuth();
  // const router = useRouter();

  // useEffect(() => {
  //   if (user === null) {
  //     router.push('/auth/login');
  //   }
  // }, [user, router]);

  // if (!user) return null;
  const router = useRouter();

  const handleLogout = () => {
    // auth.signOut() // se estiver usando Firebase Auth
    router.push('/login');
  };
  return (
    <>
      {/* Header */}
      <AppBar position="static" sx={{ backgroundColor: '#BA0100' }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6">Pedidos da Sorte</Typography>
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
              title="➕ Criar Raspadinha"
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
    </>

  )
}
