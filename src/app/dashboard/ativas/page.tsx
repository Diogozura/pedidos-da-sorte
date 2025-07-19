/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  Timestamp,
  updateDoc,
  doc,
} from 'firebase/firestore';
import {
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { toast } from 'react-toastify';
import BaseDash from '../base';

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
  const [codigosPorCampanha, setCodigosPorCampanha] = useState<Record<string, Codigo[]>>({});
  const [filtros, setFiltros] = useState<Record<string, 'todos' | 'premiados'>>({});

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
      setCodigosPorCampanha(codesMap);
    };
    fetchCampanhasECodigos();
  }, []);

  const gerarCodigo = async (campanhaId: string) => {
    try {
      const posicoesSnap = await getDocs(
        query(
          collection(db, 'campanhas', campanhaId, 'posicoes'),
          where('usado', '==', false)
        )
      );
      if (posicoesSnap.empty) {
        toast.warning('Sem posições disponíveis para essa campanha.');
        return;
      }

      const posDoc = posicoesSnap.docs[0];
      const posData = posDoc.data();
      const posId = posDoc.id;

      const novoCodigo = Math.random().toString(36).substring(2, 8).toUpperCase();

      const codigoRef = await addDoc(collection(db, 'codigos'), {
        codigo: novoCodigo,
        campanhaId,
        posicao: posId,
        criadoEm: Timestamp.now(),
        status: 'ativo',
        usado: false,
        premiado: posData.prize || 'nenhum',
      });

      await updateDoc(
        doc(db, 'campanhas', campanhaId, 'posicoes', posId),
        { usado: true }
      );

      const novo: Codigo = {
        id: codigoRef.id,
        codigo: novoCodigo,
        status: 'ativo',
        premiado: posData.prize || 'nenhum',
      };
      setCodigosPorCampanha((prev) => ({
        ...prev,
        [campanhaId]: [...(prev[campanhaId] || []), novo],
      }));

      toast.success(`Código gerado: ${novoCodigo}`);
      navigator.clipboard.writeText(novoCodigo);
    } catch (err: any) {
      toast.error('Erro ao gerar código: ' + err.message);
    }
  };

  return (
    <BaseDash>
      <Container maxWidth="md" sx={{ mt: 6 }}>
        <Typography variant="h4" gutterBottom>
          Campanhas Ativas
        </Typography>
        <Grid container spacing={3}>
          {campanhas.map((camp) => {
            const filtro = filtros[camp.id] ?? 'todos';
            const listaOrig = codigosPorCampanha[camp.id] || [];
            const lista =
              filtro === 'premiados'
                ? listaOrig.filter((c) => c.premiado && c.premiado !== 'nenhum')
                : listaOrig;

            return (
              <Grid size={{xs:12, md:6}} key={camp.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{camp.nome}</Typography>
                    <Typography>
                      Raspadinhas restantes: {camp.raspadinhasRestantes}
                    </Typography>
                    <Typography>
                      Prêmios restantes: {camp.premiosRestantes}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      variant="contained"
                      onClick={() => gerarCodigo(camp.id)}
                      disabled={camp.raspadinhasRestantes <= 0}
                    >
                      {camp.raspadinhasRestantes > 0
                        ? 'Gerar Código'
                        : 'Campanha Encerrada'}
                    </Button>
                  </CardActions>

                  {/* Filtro de códigos */}
                  <CardActions sx={{ justifyContent: 'center', gap: 1 }}>
                    <Button
                      size="small"
                      variant={filtro === 'todos' ? 'contained' : 'outlined'}
                      onClick={() =>
                        setFiltros((prev) => ({ ...prev, [camp.id]: 'todos' }))
                      }
                    >
                      Todos
                    </Button>
                    <Button
                      size="small"
                      variant={
                        filtro === 'premiados' ? 'contained' : 'outlined'
                      }
                      onClick={() =>
                        setFiltros((prev) => ({ ...prev, [camp.id]: 'premiados' }))
                      }
                    >
                      Premiados
                    </Button>
                  </CardActions>

                  {lista.length > 0 && (
                    <>
                      <Divider sx={{ my: 1 }} />
                      <List dense>
                        {lista.map((c) => (
                          <ListItem key={c.id}>
                            <ListItemText
                              primary={`Código: ${c.codigo}`}
                              secondary={`Prêmio: ${c.premiado}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </>
                  )}
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </BaseDash>
  );
}
