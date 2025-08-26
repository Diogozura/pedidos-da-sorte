'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  Container, Table, TableHead, TableRow, TableCell,
  TableBody, Button, Typography
} from '@mui/material';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type Mode = 'resgatados' | 'naoResgatados';

type LinhaResgatado = {
  codigoOriginal: string;
  nome: string;
  telefone: string;
  premio: string;
  resgatadoEm: string;
};

type LinhaNaoResgatado = {
  codigoOriginal: string;
  nome: string;
  telefone: string;
  premio: string;
  sorteadoEm: string;
};

type Props = {
  campanhaId: string;
  mode: Mode;
};

function chunk<T>(arr: T[], size: number) {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );
}

export default function PremiosTabela({ campanhaId, mode }: Props) {
  const [resgatados, setResgatados] = useState<LinhaResgatado[]>([]);
  const [naoResgatados, setNaoResgatados] = useState<LinhaNaoResgatado[]>([]);

  const hasData = useMemo(
    () => (mode === 'resgatados' ? resgatados.length > 0 : naoResgatados.length > 0),
    [mode, resgatados, naoResgatados]
  );

  useEffect(() => {
    if (!campanhaId) return;

    const fetchData = async () => {
      if (mode === 'resgatados') {
        // === Vouchers usados
        const qVouchers = query(
          collection(db, 'vouchers'),
          where('campanhaId', '==', campanhaId),
          where('usado', '==', true)
        );
        const vSnap = await getDocs(qVouchers);
        const vouchers = vSnap.docs
          .map((d) => {
            const v = d.data() as { codigoOriginal?: string; usadoEm?: Timestamp };
            return {
              codigoOriginal: v.codigoOriginal ?? '',
              usadoEm: v.usadoEm ?? null,
            };
          })
          .filter(v => v.codigoOriginal);

        if (vouchers.length === 0) {
          setResgatados([]);
          return;
        }

        // pega ganhadores por codigoOriginal (em chunks de 10 pro where('in'))
        const originals = Array.from(new Set(vouchers.map(v => v.codigoOriginal)));
        const originalsChunks = chunk(originals, 10);

        const byCode = new Map<string, {nome?: string; telefone?: string; premio?: string }>();
        for (const part of originalsChunks) {
          const qG = query(
            collection(db, 'ganhadores'),
            where('campanhaId', '==', campanhaId),
            where('codigoOriginal', 'in', part)
          );
          const gSnap = await getDocs(qG);
          gSnap.forEach((gDoc) => {
            const g = gDoc.data() as { codigoOriginal?: string; nome?: string; telefone?: string; premio?: string };
            if (g.codigoOriginal) byCode.set(g.codigoOriginal, { nome:g.nome, telefone: g.telefone, premio: g.premio });
          });
        }
       
        const rows: LinhaResgatado[] = vouchers.map((v) => {
          const g = byCode.get(v.codigoOriginal) ?? {};
          const resgatadoEm =
            v.usadoEm instanceof Timestamp ? v.usadoEm.toDate().toLocaleString() : '---';
          return {
            codigoOriginal: v.codigoOriginal,
            nome: g.nome ?? '---',
            telefone: g.telefone ?? '---',
            premio: g.premio ?? '---',
            resgatadoEm,
          };
        });

        setResgatados(rows);
      } else {
        // === Todos ganhadores da campanha
        const qG = query(collection(db, 'ganhadores'), where('campanhaId', '==', campanhaId));
        const gSnap = await getDocs(qG);
        const ganhadores = gSnap.docs
          .map((d) => {
            const g = d.data() as {
              codigoOriginal?: string;
              criadoEm?: Timestamp;
              nome?: string;
              telefone?: string;
              premio?: string;
            };
            return {
              codigoOriginal: g.codigoOriginal ?? '',
              sorteadoEm: g.criadoEm ? g.criadoEm.toDate().toLocaleString() : '---',
              nome: g.nome ?? '---',
              telefone: g.telefone ?? '---',
              premio: g.premio ?? '---',
            };
          })
          .filter(g => g.codigoOriginal);

        if (ganhadores.length === 0) {
          setNaoResgatados([]);
          return;
        }

        // Vouchers usados para excluir
        const qV = query(
          collection(db, 'vouchers'),
          where('campanhaId', '==', campanhaId),
          where('usado', '==', true)
        );
        const vSnap = await getDocs(qV);
        const usados = new Set(
          vSnap.docs
            .map(v => (v.data() as { codigoOriginal?: string }).codigoOriginal)
            .filter(Boolean) as string[]
        );

        const pendentes = ganhadores.filter(g => !usados.has(g.codigoOriginal));
        setNaoResgatados(pendentes);
      }
    };

    fetchData();
  }, [campanhaId, mode]);

  // helpers de export (apenas onde faz sentido)
  const exportarTelefones = () => {
    const content =
      mode === 'resgatados'
        ? resgatados.map(r => r.telefone).join('\n')
        : naoResgatados.map(r => r.telefone).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = mode === 'resgatados' ? 'telefones-resgatados.txt' : 'telefones-nao-resgatados.txt';
    a.click();
  };

  const exportarCSV = () => {
    let header = '';
    let rows = '';
    if (mode === 'resgatados') {
      header = 'CodigoOriginal,Telefone,Premio,DataResgate\n';
      rows = resgatados
        .map(r => `${r.codigoOriginal},${r.nome},${r.telefone},${r.premio},${r.resgatadoEm}`)
        .join('\n');
    } else {
      header = 'CodigoOriginal,Nome,Telefone,Premio,SorteadoEm\n';
      rows = naoResgatados
        .map(r => `${r.codigoOriginal},${r.nome},${r.telefone},${r.premio},${r.sorteadoEm}`)
        .join('\n');
    }
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = mode === 'resgatados' ? 'premios-resgatados.csv' : 'premios-nao-resgatados.csv';
    a.click();
  };
console.log(resgatados)
  return (
    <Container sx={{ mt: 4 }}>
      {!hasData ? (
        <Typography>
          {mode === 'resgatados' ? 'Ainda sem prêmios resgatados' : 'Ainda sem prêmios pendentes de retirada'}
        </Typography>
      ) : (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                 <TableCell>Nome</TableCell>
                <TableCell>Telefone</TableCell>
                <TableCell>Prêmio</TableCell>
                <TableCell>{mode === 'resgatados' ? 'Data de Retirada' : 'Sorteado em'}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mode === 'resgatados'
                ? resgatados.map((r) => (
                    <TableRow key={r.codigoOriginal}>
                      <TableCell>{r.codigoOriginal}</TableCell>
                      <TableCell>{r.nome}</TableCell>
                      <TableCell>{r.telefone}</TableCell>
                      <TableCell>{r.premio}</TableCell>
                      <TableCell>{r.resgatadoEm}</TableCell>
                    </TableRow>
                  ))
                : naoResgatados.map((p) => (
                    <TableRow key={p.codigoOriginal}>
                      <TableCell>{p.codigoOriginal}</TableCell>
                      <TableCell>{p.nome}</TableCell>
                      <TableCell>{p.telefone}</TableCell>
                      <TableCell>{p.premio}</TableCell>
                      <TableCell>{p.sorteadoEm}</TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>

          <div style={{ display: 'flex', gap: 16, marginTop: 20 }}>
            <Button size="medium" variant="contained" color="error" onClick={exportarTelefones}>
              Exportar Telefones
            </Button>
            <Button size="medium" variant="contained" color="error" onClick={exportarCSV}>
              Exportar Tabela Completa
            </Button>
          </div>
        </>
      )}
    </Container>
  );
}
