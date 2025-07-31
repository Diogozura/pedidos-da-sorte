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

interface Ganhador {
  id: string;
  nome: string;
  telefone: string;
  endereco: string;
  criadoEm?: string;
}

export default function PremiosResgatados({ campanhaId }: Props) {
  const [ganhadores, setGanhadores] = useState<Ganhador[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const buscar = async () => {
      try {
        const q = query(
          collection(db, 'ganhadores'),
          where('campanhaId', '==', campanhaId)
        );

        const snap = await getDocs(q);
        const lista: Ganhador[] = snap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            nome: data.nome || 'Desconhecido',
            telefone: data.telefone || 'N/A',
            endereco: data.endereco || 'Não informado',
            criadoEm: data.criadoEm?.toDate().toLocaleString() || '',
          };
        });

        setGanhadores(lista);
      } catch (err) {
        console.error('Erro ao buscar ganhadores:', err);
      } finally {
        setCarregando(false);
      }
    };

    if (campanhaId) buscar();
  }, [campanhaId]);

  if (carregando) return <Typography>Carregando prêmios resgatados...</Typography>;

  if (!ganhadores.length) {
    return (
      <Box mt={4}>
        <Typography align="center">Ainda sem prêmios resgatados.</Typography>
      </Box>
    );
  }

  return (
    <Box mt={4} component={Paper} elevation={2}>
      <Typography variant="h6" px={2} pt={2}>
        Prêmios Resgatados
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Nome</TableCell>
            <TableCell>Telefone</TableCell>
            <TableCell>Endereço</TableCell>
            <TableCell>Data</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {ganhadores.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.nome}</TableCell>
              <TableCell>{item.telefone}</TableCell>
              <TableCell>{item.endereco}</TableCell>
              <TableCell>{item.criadoEm}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
