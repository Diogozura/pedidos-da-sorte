'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
} from '@mui/material';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface CodigoData {
  id: string;
  codigo: string;
  criadoEm?: Timestamp;
  usado: boolean;
  status: string;
  telefone?: string;
}

interface Props {
  campanhaId: string;
}

export default function RelatorioEnvioCampanha({ campanhaId }: Props) {
  const [codigos, setCodigos] = useState<CodigoData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarCodigos = async () => {
      try {
        const q = query(collection(db, 'codigos'), where('campanhaId', '==', campanhaId));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as CodigoData[];

        setCodigos(data);
      } catch (err) {
        console.error('Erro ao carregar códigos:', err);
      } finally {
        setLoading(false);
      }
    };

    carregarCodigos();
  }, [campanhaId]);

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Relatório de Envio
      </Typography>

      {loading ? (
        <CircularProgress />
      ) : codigos.length === 0 ? (
        <Typography>Nenhum código enviado ainda.</Typography>
      ) : (
        <Paper sx={{ overflow: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Código</strong></TableCell>
                <TableCell><strong>Telefone</strong></TableCell>
                <TableCell><strong>Data</strong></TableCell>
                <TableCell><strong>Usado?</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {codigos.map(codigo => (
                <TableRow key={codigo.id}>
                  <TableCell>{codigo.codigo}</TableCell>
                  <TableCell>{codigo.telefone ?? '-'}</TableCell>
                  <TableCell>
                    {codigo.criadoEm
                      ? new Date(codigo.criadoEm.seconds * 1000).toLocaleString('pt-BR')
                      : '-'}
                  </TableCell>
                  <TableCell>{codigo.usado ? 'Sim' : 'Não'}</TableCell>
                  <TableCell>{codigo.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Container>
  );
}
