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
import Link from 'next/link';
import BaseDash from '../base';

interface Campanha {
  id: string;
  nome: string;
  raspadinhasRestantes: number;
  premiadasRestantes: number;
  premiadasTotais: number;
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
  const [filtros, setFiltros] = useState<Record<string, 'todos' | 'premiados' | 'recentes'>>({});

  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [codigosPorCampanha, setCodigosPorCampanha] = useState<{
    [campanhaId: string]: Codigo[];
  }>({});

  useEffect(() => {
    const fetchCampanhasECodigos = async () => {
      const campanhasSnap = await getDocs(collection(db, 'campanhas'));
      const campanhasList: Campanha[] = [];

      for (const docItem of campanhasSnap.docs) {
        const data = docItem.data();
        if (data.raspadinhasRestantes >= 0) {
          const campanha: Campanha = {
            id: docItem.id,
            nome: data.nome,
            raspadinhasRestantes: data.raspadinhasRestantes,
            premiadasTotais: data.premiadasTotais,
            totalRaspadinhas: data.totalRaspadinhas,
            premiadasRestantes: data.premiadasRestantes,
          };
          campanhasList.push(campanha);

          // buscar códigos
          const codigosSnap = await getDocs(
            query(collection(db, 'codigos'), where('campanhaId', '==', docItem.id))
          );
          console.log('codigosSnap', codigosSnap)
          const codigos: Codigo[] = codigosSnap.docs.map((doc) => ({
            id: doc.id,
            codigo: doc.data().codigo,
            usado: doc.data().usado,
            status: doc.data().status, // fallback p/ antigos
            premiado: doc.data().premiado,
            criadoEm: doc.data().criadoEm,
            usadoEm: doc.data()?.usadoEm,
          }));

          setCodigosPorCampanha((prev) => ({
            ...prev,
            [docItem.id]: codigos,
          }));
        }
      }

      setCampanhas(campanhasList);
    };

    fetchCampanhasECodigos();
  }, []);

  const gerarCodigo = async (campanhaId: string) => {
    try {
      const campanhaSnap = await getDocs(
        query(collection(db, 'campanhas'), where('__name__', '==', campanhaId))
      );

      if (campanhaSnap.empty) {
        toast.error('Campanha não encontrada.');
        return;
      }

      const campanha = campanhaSnap.docs[0].data();
      if (campanha.raspadinhasRestantes <= 0) {
        toast.warning('Esta campanha já encerrou. Não é possível gerar mais códigos.');
        return;
      }

      const novoCodigo = Math.random().toString(36).substring(2, 8).toUpperCase();

      const docRef = await addDoc(collection(db, 'codigos'), {
        codigo: novoCodigo,
        campanhaId,
        criadoEm: Timestamp.now(),
        usado: false,
        status: 'ativo',
        premiado: 'não sorteado',
      });

      const novo: Codigo = {
        id: docRef.id,
        codigo: novoCodigo,
        status: 'ativo',
        premiado: 'não sorteado',
      };

      setCodigosPorCampanha((prev) => ({
        ...prev,
        [campanhaId]: [...(prev[campanhaId] || []), novo],
      }));

      toast.success(`Código gerado: ${novoCodigo}`);
      navigator.clipboard.writeText(novoCodigo);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error('Erro ao gerar código: ' + err.message);
    }
  };


  return (
    <>
      <BaseDash>
        <Container maxWidth="md" sx={{ mt: 6 }}>
          <Typography variant="h4" gutterBottom>
            Campanhas Ativas
          </Typography>

          <Grid container spacing={3}>
            {campanhas.map((campanha) => {
              const lista = codigosPorCampanha[campanha.id] || [];
              // pega o filtro dessa campanha, default para 'todos'
              const filtro = filtros[campanha.id] ?? 'todos';

              // aplica filtro
              let codigosFiltrados = lista.filter((c) =>
                filtro === 'premiados' ? c.premiado : true
              );
              // aplica ordenação
              if (filtro === 'recentes') {
                codigosFiltrados = codigosFiltrados.sort(
                  (a, b) => (b.criadoEm?.seconds || 0) - (a.criadoEm?.seconds || 0)
                );
              }

              return (



                <Grid size={{ xs: 12, md: 6 }} key={campanha.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6">{campanha.nome}</Typography>
                      <Typography variant="body2">
                        Raspadinhas restantes:{' '}
                        <strong>
                          {campanha.totalRaspadinhas}/{campanha.raspadinhasRestantes}
                        </strong>
                      </Typography>
                      <Typography variant="body2">
                        Prêmios restantes:{' '}
                        <strong>
                          {campanha.premiadasTotais}/{campanha.premiadasRestantes}
                        </strong>
                      </Typography>
                    </CardContent>

                    <CardActions>
                      <Button
                        variant="contained"
                        onClick={() => gerarCodigo(campanha.id)}
                        disabled={campanha.raspadinhasRestantes <= 0}
                      >
                        {campanha.raspadinhasRestantes <= 0
                          ? 'Campanha Encerrada'
                          : 'Gerar Código'}
                      </Button>
                    </CardActions>

                    {lista.length > 0 && (
                      <>
                        <Divider sx={{ mt: 2, mb: 1 }} />
                        <Typography sx={{ px: 2 }} variant="subtitle2">
                          Códigos gerados
                        </Typography>

                        {/* filtros por campanha */}
                        <CardActions sx={{ justifyContent: 'center', gap: 1 }}>
                          {(['todos', 'premiados', 'recentes'] as const).map((f) => (
                            <Button
                              key={f}
                              variant={filtro === f ? 'contained' : 'outlined'}
                              size="small"
                              onClick={() =>
                                setFiltros({ ...filtros, [campanha.id]: f })
                              }
                            >
                              {f === 'todos'
                                ? 'Todos'
                                : f === 'premiados'
                                  ? 'Premiadas'
                                  : 'Recentes'}
                            </Button>
                          ))}
                        </CardActions>

                        {/* lista filtrada */}
                        <List dense disablePadding>
                          {codigosFiltrados.map((c) => (
                            <ListItem key={c.id}>
                              <ListItemText
                                primary={`Código: ${c.codigo}`}
                                secondary={
                                  <>
                                    <Typography variant="body2">
                                      Status: {c.status}
                                    </Typography>
                                    <Typography variant="body2">
                                      link: <Link href={'/sorteio'}>Sorteio</Link>
                                    </Typography>
                                    {c.criadoEm && (
                                      <Typography variant="body2">
                                        Criado em:{' '}
                                        {c.criadoEm.toDate().toLocaleString()}
                                      </Typography>
                                    )}
                                    {c.usadoEm && (
                                      <Typography variant="body2">
                                        Usado em:{' '}
                                        {c.usadoEm.toDate().toLocaleString()}
                                      </Typography>
                                    )}
                                  </>
                                }
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
      </BaseDash >
    </>
  );
}
