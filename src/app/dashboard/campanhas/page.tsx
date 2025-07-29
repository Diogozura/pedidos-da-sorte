/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import {
  Container,
  Grid,
  Typography,
  CardContent,
  ButtonBase,
} from '@mui/material';
import BaseDash from '../base';
import { useRouter } from 'next/navigation';

interface Campanha {
  id: string;
  nome: string;
  raspadinhasRestantes: number;
  premiosRestantes: number;
  premiosTotais: number;
  totalRaspadinhas: number;
}

interface Codigo {
  id: string;
  codigo: string;
  status: string;
  criadoEm?: Timestamp;
  usadoEm?: Timestamp;
  premiado?: string;
}

export default function JogosAtivos() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const router = useRouter()


  useEffect(() => {
    const fetchCampanhasECodigos = async () => {
      const campSnap = await getDocs(collection(db, 'campanhas'));
      const campList: Campanha[] = [];
      const codesMap: Record<string, Codigo[]> = {};

      for (const campDoc of campSnap.docs) {
        const data = campDoc.data();
        const camp: Campanha = {
          id: campDoc.id,
          nome: data.nome,
          raspadinhasRestantes: data.raspadinhasRestantes,
          premiosRestantes: data.premiosRestantes,
          premiosTotais: data.premiosTotais,
          totalRaspadinhas: data.totalRaspadinhas,
        };
        campList.push(camp);

        const codesSnap = await getDocs(
          query(
            collection(db, 'codigos'),
            where('campanhaId', '==', campDoc.id)
          )
        );
        const listaCodigos: Codigo[] = codesSnap.docs.map((cd) => ({
          id: cd.id,
          codigo: cd.data().codigo,
          status: cd.data().status,
          criadoEm: cd.data().criadoEm,
          usadoEm: cd.data().usadoEm,
          premiado: cd.data().premiado,
        }));
        codesMap[campDoc.id] = listaCodigos;
      }

      setCampanhas(campList);
    };
    fetchCampanhasECodigos();
  }, []);

  console.log('campanhas', campanhas)

  const textColor = '#FFFFFF';
  return (
    <BaseDash>
      <Container maxWidth="md" sx={{ mt: 6 }}>
        <Typography variant="h4" gutterBottom>
          Campanhas Ativas
        </Typography>
        <Grid container spacing={3}>
          {campanhas.map((camp) => {


            return (
              <Grid size={{ xs: 12, md: 4 }} key={camp.id}>
                <ButtonBase
                  onClick={() => router.push(`/dashboard/campanhas/${camp.id}`)}
                  sx={{
                    width: 160,
                    height: 160,
                    backgroundColor: '#BA0100',
                    color: textColor,
                    borderRadius: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 1,
                    boxShadow: 2,
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.05)',
                    },
                    padding: 2
                  }}>
                  <CardContent>
                    <Typography variant="h6">{camp.nome}</Typography>

                  </CardContent>



                </ButtonBase>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </BaseDash>
  );
}
