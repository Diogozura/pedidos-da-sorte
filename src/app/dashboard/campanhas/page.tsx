/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Container,
  Grid,
  Typography,
  CardContent,
  ButtonBase,
  Box,
  CircularProgress,
} from '@mui/material';
import BaseDash from '../base';
import { useRouter } from 'next/navigation';
import { useCampanhasPermitidas } from '@/hook/useCampanhasPermitidas';

interface Codigo {
  id: string;
  codigo: string;
  status: string;
  criadoEm?: Timestamp;
  usadoEm?: Timestamp;
  premiado?: string;
}

export default function JogosAtivos() {
  const { campanhas, loading } = useCampanhasPermitidas();
  const [codigosMap, setCodigosMap] = useState<Record<string, Codigo[]>>({});
  const router = useRouter();

  useEffect(() => {
    const fetchCodigos = async () => {
      const map: Record<string, Codigo[]> = {};
      for (const camp of campanhas) {
        const snap = await getDocs(
          query(collection(db, 'codigos'), where('campanhaId', '==', camp.id))
        );
        map[camp.id] = snap.docs.map((cd) => ({
          id: cd.id,
          codigo: cd.data().codigo,
          status: cd.data().status,
          criadoEm: cd.data().criadoEm,
          usadoEm: cd.data().usadoEm,
          premiado: cd.data().premiado,
        }));
      }
      setCodigosMap(map);
    };

    if (campanhas.length) {
      fetchCodigos();
    }
  }, [campanhas]);

  if (loading) {
    return (
      <BaseDash>
        <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
          <CircularProgress />
        </Box>
      </BaseDash>
    );
  }

  if (!campanhas.length) {
    return (
      <BaseDash>
        <Container maxWidth="sm" sx={{ mt: 6, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Nenhuma campanha disponível
          </Typography>
          <Typography variant="body1" mb={4}>
            Verifique se há campanhas vinculadas à sua conta.
          </Typography>
        </Container>
      </BaseDash>
    );
  }
  const getCorStatus = (status: string) => {
    switch (status) {
      case 'ativa':
        return '#BA0100';
      case 'pausada':
        return '#e4c160';
      case 'encerrada':
        return '#999';
      default:
        return '#999';
    }
  };
  return (
    <BaseDash>
      <Container maxWidth="md" sx={{ mt: 6 }}>
        <Typography variant="h4" gutterBottom>
          Campanhas Ativas
        </Typography>
        <Grid container spacing={3}>
          {campanhas.map((camp) => (
            <Grid size={{ xs: 12, md: 4 }} key={camp.id}>
              <ButtonBase
                onClick={() => router.push(`/dashboard/campanhas/${camp.id}`)}
                sx={{
                  width: '100%',
                  height: 160,
                  backgroundColor: getCorStatus(camp.status),
                  color: '#FFFFFF',
                  borderRadius: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  boxShadow: 2,
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.05)' },
                  padding: 2,
                }}
              >
                <CardContent>
                  <Typography variant="h6">{camp.nome}</Typography>
                  {/* Exemplo: total de códigos */}
                  <Typography variant="body2">
                    Códigos: {codigosMap[camp.id]?.length ?? 0}
                  </Typography>
                  <Typography variant="body2">
                    status: {camp.status?.toUpperCase()}
                  </Typography>
                </CardContent>
              </ButtonBase>
            </Grid>
          ))}
        </Grid>
      </Container>
    </BaseDash>
  );
}
