'use client';

import { Box, Button, Chip, Container, FormControl, Grid, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import BaseDash from '../base';
import ValidateVoucherPanel from './ValidateVoucher';

import EnviarCodigoAutomatico from './EnviarCodigoAutomatico';
import EnviarCodigoManual from './EnviarCodigoManual';
import { useState } from 'react';
import { useCampanhasPermitidas } from '@/hook/useCampanhasPermitidas';
import { useRouter } from 'next/navigation';
import AppBreadcrumbs from '@/components/shared/AppBreadcrumbs';
import { faHome } from '@fortawesome/free-solid-svg-icons';

export default function GerenciarCodigos() {
  const router = useRouter();
  const { campanhas, loading } = useCampanhasPermitidas();
  const [campanhaSelecionada, setCampanhaSelecionada] = useState<string>('');
  const campanha = campanhas.find((c) => c.id === campanhaSelecionada);


  if (loading) return <p>Carregando campanhas...</p>;

  if (campanhas.length == 0) {

    return (
      <BaseDash>
        <Container maxWidth="sm" sx={{ mt: 6, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Nenhuma campanha ativa disponível
          </Typography>
          <Typography variant="body1" mb={4}>
            Você ainda não possui campanhas ativas vinculadas à sua conta.
          </Typography>
          <Button variant="contained" color="primary" onClick={() => router.push('/dashboard')}>
            Voltar para a Dashboard
          </Button>
        </Container>
      </BaseDash>
    );
  }

  return (
    <BaseDash>
      <Container maxWidth="lg" sx={{ mt: 6 }}>
        <AppBreadcrumbs
          items={[
            { label: 'Início', href: '/dashboard', icon: faHome },
            { label: 'Gerenciar Códigos', },
          ]}
        />
        <Typography component={'h1'} textAlign={'center'} py={2} variant="h4">
          Gerenciador de Códigos
        </Typography>

        <Box maxWidth={400} mx="auto" mb={4}>
          <FormControl fullWidth>
            <InputLabel id="campanha-select-label">Selecionar Campanha</InputLabel>
            <Select
              labelId="campanha-select-label"
              value={campanhaSelecionada}
              label="Selecionar Campanha"
              onChange={(e) => setCampanhaSelecionada(e.target.value)}
            >
              {campanhas.map((camp) => (
                <MenuItem key={camp.id} value={camp.id}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip
                      size="small"
                      label={camp.status.toUpperCase()}
                      color={camp.status === 'ativa' ? 'success' : 'default'}
                    />
                    {camp.nome}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Grid container spacing={4} justifyContent="center" alignItems="stretch">
          <Grid size={{ xs: 12, md: 6 }}>
            <EnviarCodigoManual campanhaId={campanha?.id || ''} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <ValidateVoucherPanel />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <EnviarCodigoAutomatico campanhaId={campanha?.id || ''} />
          </Grid>
        </Grid>
      </Container>
    </BaseDash>
  );
}
