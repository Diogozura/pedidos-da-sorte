/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/dashboard/criar-campanha/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Typography, Grid, TextField, Button, FormControl, InputLabel, MenuItem, Select, Divider } from '@mui/material';
import { getStorage, ref as storageRef, listAll, getDownloadURL, uploadBytes } from 'firebase/storage';
import { collection, addDoc, writeBatch, doc } from 'firebase/firestore';
import { toast } from 'react-toastify';

import { db } from '@/lib/firebase';
import BaseDash from '../base';
import ProtegePagina from '@/components/ProtegePagina';
import { useUsuarioLogado } from '@/hook/useUsuarioLogado';
import PremiosForm, { Premio } from '@/components/CriarCampanha/PremiosForm';
import LogoUploader from '@/components/CriarCampanha/LogoUploader';
import AppBreadcrumbs from '@/components/shared/AppBreadcrumbs';
import { faHome, faTrophy } from '@fortawesome/free-solid-svg-icons';

export default function CriarCampanhaPage() {
  const { usuario } = useUsuarioLogado();
  const router = useRouter();
  const hoje = new Date().toISOString().split('T')[0];

  const [nome, setNome] = useState('');
  const [totalRaspadinhas, setTotalRaspadinhas] = useState('100');
  const [modo, setModo] = useState<'raspadinha' | 'prazo'>('raspadinha');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [premios, setPremios] = useState<Premio[]>([]);
  const [logoPreview, setLogoPreview] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [imagensDisponiveis, setImagensDisponiveis] = useState<string[]>([]);
  const [logosDisponiveis, setLogosDisponiveis] = useState<string[]>([]);

  console.log('usuario', usuario);
  console.log('logoPreview', logoPreview);
  console.log('logoFile', logoFile);

  useEffect(() => {
    const carregarLogos = async () => {
      try {
        const storage = getStorage();
        const pasta = storageRef(storage, `logos/${usuario?.uid}`);
        const lista = await listAll(pasta);
        const urls = await Promise.all(lista.items.map(item => getDownloadURL(item)));
        setLogosDisponiveis(urls);
      } catch (error) {
        console.error(error);
        toast.error('Erro ao carregar logos da conta.');
      }
    };

    if (usuario?.uid) carregarLogos();
  }, [usuario?.uid]);

  useEffect(() => {
    const carregarImagens = async () => {
      try {
        const storage = getStorage();
        const pasta = storageRef(storage, `premios/${usuario?.uid}`);
        const lista = await listAll(pasta);
        const urls = await Promise.all(lista.items.map(item => getDownloadURL(item)));
        setImagensDisponiveis(urls);
      } catch (error) {
        console.error(error);
        toast.error('Erro ao carregar imagens dos prêmios.');
      }
    };
    if (usuario?.uid) carregarImagens();
  }, [usuario?.uid]);


  const criarCampanha = async () => {
    if (!nome.trim() || !totalRaspadinhas) {
      toast.error('Preencha o nome e o total de raspadinhas.');
      return;
    }
    if (modo === 'prazo') {
      if (!dataInicio || dataInicio < hoje) {
        toast.error('A data de início não pode ser anterior a hoje.');
        return;
      }
      if (!dataFim || dataFim < dataInicio) {
        toast.error('A data de fim não pode ser anterior à data de início.');
        return;
      }
    }
    const total = parseInt(totalRaspadinhas, 10);
    if (isNaN(total)) {
      toast.error('Total de raspadinhas inválido.');
      return;
    }

    const storage = getStorage();
    const premiosProcessados: Premio[] = [];

    for (let i = 0; i < premios.length; i++) {
      const premio = premios[i];

      let imagemFinal = premio.imagem;

      if (premio.file) {
        try {
          const path = `premios/${usuario?.uid}/${Date.now()}_${premio.file.name}`;
          const ref = storageRef(storage, path);
          await uploadBytes(ref, premio.file);
          imagemFinal = await getDownloadURL(ref);
        } catch (err: any) {
          toast.error(`Erro ao enviar imagem do prêmio ${premio.nome}: ${err.message}`);
          return;
        }
      }

      premiosProcessados.push({
        nome: premio.nome,
        imagem: imagemFinal,
        quantidadeTotais: premio.quantidadeTotais,
      });
    }

    const somaPremios = premiosProcessados.reduce((sum, p) => sum + p.quantidadeTotais, 0);
    if (somaPremios > total) {
      toast.error('Total de raspadinhas deve ser ≥ soma das quantidades de prêmios.');
      return;
    }

    // >>>> AQUI ESTÁ O AJUSTE DA LOGO <<<<
    let logoUrl = '';
    try {
      if (logoFile) {
        const path = `logos/${usuario?.uid}/${Date.now()}_${logoFile.name}`;
        const ref = storageRef(storage, path);
        await uploadBytes(ref, logoFile);
        logoUrl = await getDownloadURL(ref);
      } else if (logoPreview && /^https?:\/\//i.test(logoPreview)) {
        // Selecionou uma logo existente da biblioteca
        logoUrl = logoPreview;
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error('Erro ao enviar logo: ' + (e.message ?? 'desconhecido'));
      return;
    }

    try {
      const novaCampanha = {
        nome,
        modo,
        logoUrl,
        totalRaspadinhas: total,
        raspadinhasRestantes: total,
        premiosTotais: somaPremios,
        premiosRestantes: somaPremios,
        premios: premiosProcessados,
        criadoEm: new Date(),
        pizzariaId: usuario?.uid || null,
        status: 'ativa',
        ...(modo === 'prazo' && {
          dataInicio: new Date(`${dataInicio}T00:00:00`),
          dataFim: new Date(`${dataFim}T23:59:59`),
        })
      };
      console.log('novaCampanha', novaCampanha);
      const campanhaRef = await addDoc(collection(db, 'campanhas'), novaCampanha);

      const slots: (string | null)[] = [];
      premiosProcessados.forEach((p) => {
        for (let i = 0; i < p.quantidadeTotais; i++) slots.push(p.nome);
      });
      while (slots.length < total) slots.push(null);

      const shuffle = [...slots];
      for (let i = shuffle.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffle[i], shuffle[j]] = [shuffle[j], shuffle[i]];
      }

      const batch = writeBatch(db);
      shuffle.forEach((prizeName, index) => {
        const posRef = doc(db, 'campanhas', campanhaRef.id, 'posicoes', `${index + 1}`);
        batch.set(posRef, {
          chance: index + 1,
          prize: prizeName,
          usado: false,
          enviado: false,
        });
      });

      await batch.commit();
      toast.success('Campanha criada com sucesso!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error('Erro ao criar campanha: ' + err.message);
    }
  };


  const handleCancelar = () => {
    toast.info('Cadastro cancelado.');
    router.push('/dashboard');
  };

  return (
    <ProtegePagina permitido={['admin', 'empresa']}>

      <BaseDash>

        <Container maxWidth="lg" sx={{ mt: 6 }}>
          <AppBreadcrumbs
            items={[
              { label: 'Início', href: '/dashboard', icon: faHome },
              { label: 'escolher jogo', href: '/dashboard/escolher-jogo' },
              { label: 'Criar campanha', icon: faTrophy },
            ]}
          />
          <Typography variant="h4" textAlign="center" gutterBottom>
            Criar nova campanha
          </Typography>

          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 4 }} >
              <LogoUploader
                preview={logoPreview}
                setPreview={setLogoPreview}
                setFile={setLogoFile}
                usuarioId={usuario?.uid || ''}
                logosDisponiveis={logosDisponiveis}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 8 }} >
              <Typography variant="h6" gutterBottom>Dados da Campanha</Typography>
              <TextField
                label="Nome da campanha"
                fullWidth
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                sx={{ mb: 2 }}
              />

              <TextField
                label="Total de raspadinhas"
                type="number"
                fullWidth
                value={totalRaspadinhas}
                onChange={(e) => setTotalRaspadinhas(e.target.value)}
                sx={{ mb: 2 }}
              />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="modo-label">Modo da campanha</InputLabel>
                <Select
                  labelId="modo-label"
                  label="Modo da campanha"
                  value={modo}
                  onChange={(e) => setModo(e.target.value as any)}
                >
                  <MenuItem value="raspadinha">Número de jogos</MenuItem>
                  <MenuItem value="prazo">Por tempo</MenuItem>
                </Select>
              </FormControl>

              {modo === 'prazo' && (
                <Grid container spacing={2}>
                  <Grid size={6}>
                    <TextField
                      label="Data Início"
                      type="date"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                    />
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      label="Data Fim"
                      type="date"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                    />
                  </Grid>
                </Grid>
              )}
            </Grid>

            <Grid size={12}  >
              <PremiosForm
                premios={premios}
                setPremios={setPremios}
                imagensDisponiveis={imagensDisponiveis}
                setImagensDisponiveis={setImagensDisponiveis}
                usuarioId={usuario?.uid || ''}
              />
            </Grid>

            <Grid size={12}  >
              <Button variant="contained" sx={{ m: 2 }} onClick={criarCampanha}>Cadastrar</Button>
              <Button variant="contained" color='secondary' onClick={handleCancelar}>Cancelar</Button>
            </Grid>
          </Grid>

          <Divider sx={{ mt: 4, mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            As campanhas agora pré-alocam posições aleatórias de prêmios em subcoleção `posicoes`.
          </Typography>
        </Container>
      </BaseDash>
    </ProtegePagina>
  );
}
