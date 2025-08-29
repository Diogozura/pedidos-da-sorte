// app/dashboard/page.tsx
'use client';

import DashboardCard from '@/components/DashboardCard';
import { useAuth } from '@/context/AuthContext';
import { Container, Grid, Typography } from '@mui/material';


import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import BaseDash from './base';
import ComPermissao from '@/components/ComPermissao';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faPlus, faShare, faUser } from '@fortawesome/free-solid-svg-icons';
import LoadingOverlay from '@/components/LoadingOverlay';


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
     <LoadingOverlay texto="Carregando..." />
    );
  }
console.log('user', user)


  return (
    <BaseDash>
      {/* Conteúdo */}
      <Container sx={{ mt: 6, display:'grid',  height:'60vh'}}>
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
                onClick={() => router.push('/dashboard/escolher-jogo')}
              />
            </Grid>
          </ComPermissao>

          <ComPermissao permitido={['admin', 'empresa']}>
            <Grid size={{ xs: 12, md: 3 }}>
              <DashboardCard
                icon={<FontAwesomeIcon icon={faCheck} />}
                title="Minhas campanhas"
                onClick={() => router.push('/dashboard/campanhas')}
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
                title="Gerenciador de Códigos"

                onClick={() => router.push('/dashboard/GerenciarCodigos')}
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
