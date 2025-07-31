'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Box,
  Paper,
} from '@mui/material';

interface Props {
  campanhaId: string | string[];
}

interface PremioNaoResgatado {
  id: string;
  telefone: string;
  premiado: string;
  status: string;
}

export default function PremiosNaoResgatados({ campanhaId }: Props) {
  const [dados, setDados] = useState<PremioNaoResgatado[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const buscar = async () => {
      try {
        const q = query(
          collection(db, 'codigos'),
          where('campanhaId', '==', campanhaId),
          where('premiado', '!=', null)
        );

        const snap = await getDocs(q);
        const lista: PremioNaoResgatado[] = snap.docs
          .map((doc) => ({
            id: doc.id,
            premiado: doc.data().premiado || '',
            telefone: doc.data().telefone || 'Não informado',
            status: doc.data().status || '',
          }))
          .filter((item) => item.status !== 'voucher_gerado');

        setDados(lista);
      } catch (err) {
        console.error('Erro ao buscar prêmios não resgatados:', err);
      } finally {
        setCarregando(false);
      }
    };

    if (campanhaId) buscar();
  }, [campanhaId]);

  if (carregando) return <Typography>Carregando...</Typography>;

  if (!dados.length) {
    return (
      <Box mt={4}>
        <Typography align="center">Nenhum prêmio pendente de resgate.</Typography>
      </Box>
    );
  }

  return (
    <Box mt={4} component={Paper} elevation={2}>
      <Typography variant="h6" px={2} pt={2}>
        Prêmios NÃO Resgatados
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Nome</TableCell>
            <TableCell>Telefone</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {dados.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.premiado}</TableCell>
              <TableCell>{item.telefone}</TableCell>
              <TableCell>{item.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
