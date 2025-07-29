import { useEffect, useState } from 'react';
import {
  Container, Table, TableHead, TableRow, TableCell,
  TableBody, Button, Typography
} from '@mui/material';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Resgate {
  telefone: string;
  premio: string;
  resgatadoEm: string;
}

export default function PremiosResgatados({ campanhaId }: { campanhaId: string }) {
  const [resgates, setResgates] = useState<Resgate[]>([]);

  useEffect(() => {
    const fetchResgates = async () => {
      const q = query(
        collection(db, 'codigos'),
        where('campanhaId', '==', campanhaId),
        where('status', '==', 'resgatado')
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => {
        const d = doc.data();
        return {
          telefone: d.telefone || '---',
          premio: d.premio || '---',
          resgatadoEm: d.resgatadoEm?.toDate().toLocaleDateString() || '---',
        };
      });
      setResgates(data);
    };

    fetchResgates();
  }, [campanhaId]);

  const exportarTelefones = () => {
    const content = resgates.map(r => r.telefone).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'telefones.txt';
    a.click();
  };

  const exportarTabelaCompleta = () => {
    const header = 'Telefone,Prêmio,Data\n';
    const rows = resgates.map(r => `${r.telefone},${r.premio},${r.resgatadoEm}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'premios-resgatados.csv';
    a.click();
  };

  return (
    <Container sx={{ mt: 4 }}>
      {resgates.length === 0 ? (
        <Typography>Ainda sem prêmios resgatados</Typography>
      ) : (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Telefone</TableCell>
                <TableCell>Prêmio</TableCell>
                <TableCell>Data de Retirada</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {resgates.map((r, index) => (
                <TableRow key={index}>
                  <TableCell>{r.telefone}</TableCell>
                  <TableCell>{r.premio}</TableCell>
                  <TableCell>{r.resgatadoEm}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div style={{ display: 'flex', gap: 16, marginTop: 20 }}>
            <Button variant="contained" color="error" onClick={exportarTelefones}>
              Exportar Telefones
            </Button>
            <Button variant="contained" color="error" onClick={exportarTabelaCompleta}>
              Exportar Tabela Completa
            </Button>
          </div>
        </>
      )}
    </Container>
  );
}
