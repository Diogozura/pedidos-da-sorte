// app/dashboard/page.tsx
'use client';

import DashboardCard from '@/components/DashboardCard';
import { useAuth } from '@/context/AuthContext';
import { CircularProgress, Container, Grid, Typography } from '@mui/material';


import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import BaseDash from './base';
import ComPermissao from '@/components/ComPermissao';
import ResumoCampanha from '@/components/ResumoCampanha';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faPlus, faShare, faUser } from '@fortawesome/free-solid-svg-icons';


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
        <Typography variant="h4" component={'h1'} textAlign={'center'} gutterBottom>
          Painel de controle
        </Typography>

        <Grid container spacing={2}>


          <ComPermissao permitido={['admin', 'empresa']}>
            <Grid size={{ xs: 12, md: 3 }}>
              <DashboardCard
                icon={<FontAwesomeIcon icon={faPlus} />}
                color='vermelho'
                title=" Criar nova campanha"
                onClick={() => router.push('/dashboard/criar-sorteio')}
              />
            </Grid>
          </ComPermissao>

          <ComPermissao permitido={['admin', 'empresa']}>
            <Grid size={{ xs: 12, md: 3 }}>
              <DashboardCard
                icon={<FontAwesomeIcon icon={faCheck} />}
                title="Minhas campanhas"
                onClick={() => router.push('/dashboard/ativas')}
              />
            </Grid>
          </ComPermissao>



          <ComPermissao permitido={['admin', 'empresa']}>
            <Grid size={{ xs: 12, md: 3 }}>
              <DashboardCard
                icon={<FontAwesomeIcon icon={faUser} />}
                title="Gerenciar Conta"
                color='vermelho'
                onClick={() => router.push('/dashboard/conta')}
              />
            </Grid>
          </ComPermissao>

          <ComPermissao permitido={['admin', 'empresa', 'funcionario']}>
            <Grid size={{ xs: 12, md: 3 }}>
              <DashboardCard
                icon={<FontAwesomeIcon icon={faShare} />}
                color='preto'
                title="Envio de código e validar voucher"

                onClick={() => router.push('/dashboard/enviar')}
              />
            </Grid>
          </ComPermissao>

          {/* <ComPermissao permitido={['admin', 'empresa']}>
            <Grid size={{ xs: 12, md: 12 }}>
              <ResumoCampanha />
            </Grid>
          </ComPermissao> */}

        </Grid>
      </Container>
    </BaseDash>

  )
}
