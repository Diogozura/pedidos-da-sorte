'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { getStorage, ref as storageRef, listAll, getDownloadURL, uploadBytes } from 'firebase/storage';
import { collection, addDoc, writeBatch, doc } from 'firebase/firestore';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Container,
  TextField,
  Typography,
  Button,
  Divider,

  Box,
  Grid,
  InputAdornment,
  IconButton,

} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import BaseDash from '../base';
import Head from 'next/head';
import ProtegePagina from '@/components/ProtegePagina';
import { useUsuarioLogado } from '@/hook/useUsuarioLogado';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

interface Premio {
  nome: string;
  imagem: string;
  quantidadeTotais: number;
}

// Função utilitária para embaralhar um array (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function CriarCampanha() {
  const [nome, setNome] = useState('');
  const { usuario } = useUsuarioLogado();

  console.log('usuario', usuario)






  const [totalRaspadinhas, setTotalRaspadinhas] = useState('100');
  const [modo, setModo] = useState<'raspadinha' | 'prazo'>('raspadinha');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const hoje = new Date().toISOString().split('T')[0];
   const router = useRouter();
  const [premios, setPremios] = useState<Premio[]>([
    { nome: '', imagem: '', quantidadeTotais: 1 },
  ]);
  // const [imagensDisponiveis, setImagensDisponiveis] = useState<string[]>([]);

  // índice do prêmio que está adicionando nova imagem (-1 = nenhum)
  const [uploadingIndex, setUploadingIndex] = useState<number>(-1);

  useEffect(() => {
    const storage = getStorage();
    const pasta = storageRef(storage, 'prêmios');
    listAll(pasta)
      .then(res => Promise.all(res.items.map(item => getDownloadURL(item))))
      // .then(urls => setImagensDisponiveis(urls))
      .catch(err => {
        console.error(err);
        // toast.error('Erro ao carregar imagens de prêmios.');
      });
  }, []);
  // const handleSelectImagem = (idx: number, value: string) => {
  //   if (value === 'nova') {
  //     // entra no modo upload para este prêmio
  //     setUploadingIndex(idx);
  //   } else {
  //     // apenas altera URL normal
  //     const novos = [...premios];
  //     novos[idx].imagem = value;
  //     setPremios(novos);
  //   }
  // };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || uploadingIndex < 0) return;
    const file = e.target.files[0];
    // cria preview imediato
    const previewUrl = URL.createObjectURL(file);

    // armazena imediatamente no state, antes do upload
    setPremios(prev => {
      const copia = [...prev];
      copia[uploadingIndex].imagem = previewUrl;
      return copia;
    });

    // daí faz validações e upload normalmente…
    if (file.size > 100 * 1024) {
      toast.error('A imagem deve ter menos de 100 KB.');
      return;
    }

    const img = new Image();
    img.onload = async () => {
      if (img.width !== 500 || img.height !== 500) {
        toast.error('A imagem precisa ser exatamente 500×500 px.');
        return;
      }
      try {
        const storage = getStorage();
        const nome = `premios/${Date.now()}_${file.name}`;
        const ref = storageRef(storage, nome);
        await uploadBytes(ref, file);
        const url = await getDownloadURL(ref);

        // atualiza lista de disponíveis
        // setImagensDisponiveis(prev => [...prev, url]);
        // substitui no state a preview temporária pela URL real
        setPremios(prev => {
          const copia = [...prev];
          // revoga a preview pra liberar memória
          URL.revokeObjectURL(copia[uploadingIndex].imagem);
          copia[uploadingIndex].imagem = url;
          return copia;
        });

        setUploadingIndex(-1);
        toast.success('Imagem enviada com sucesso!');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        toast.error('Falha no upload: ' + err.message);
      }
    };
    img.src = previewUrl;
  };



  const adicionarPremio = () => {
    setPremios((prev) => [...prev, { nome: '', imagem: '', quantidadeTotais: 1 }]);
  };

  const removerPremio = (index: number) => {
    setPremios((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChangePremio = (
    index: number,
    field: keyof Premio,
    value: string
  ) => {
    const novos = [...premios];
    if (field === 'quantidadeTotais') {
      novos[index].quantidadeTotais = parseInt(value) || 1;
    } else {
      novos[index][field] = value;
    }
    setPremios(novos);
  };

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
    const somaPremios = premios.reduce((sum, p) => sum + p.quantidadeTotais, 0);
    if (isNaN(total) || somaPremios > total) {
      toast.error('Total de raspadinhas deve ser ≥ soma das quantidades de prêmios.');
      return;
    }

    try {
      // 1. Cria a campanha
      // 1. Monta dados da campanha
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const novaCampanha: Record<string, any> = {
        nome,
        modo,
        totalRaspadinhas: total,
        raspadinhasRestantes: total,
        premiosTotais: somaPremios,
        premiosRestantes: somaPremios,
        premios,
        criadoEm: new Date(),
        pizzariaId: usuario?.uid || null, 
        status: 'ativa'
      };

      if (modo === 'prazo') {
        novaCampanha.dataInicio = new Date(`${dataInicio}T00:00:00`);
        novaCampanha.dataFim = new Date(`${dataFim}T23:59:59`);
      }

      // 2. Cria a campanha no Firestore
      const campanhasCol = collection(db, 'campanhas');
      const campanhaRef = await addDoc(campanhasCol, novaCampanha);
      ;

      // 2. Prepara lista de slots (prêmios + nulls)
      const slots: (string | null)[] = [];
      premios.forEach((p) => {
        for (let i = 0; i < p.quantidadeTotais; i++) slots.push(p.nome);
      });
      // preenche o restante com nulls
      while (slots.length < total) slots.push(null);

      // 3. Embaralha slots para distribuição aleatória
      const shuffledSlots = shuffleArray(slots);

      // 4. Gera subcoleção de posições
      const batch = writeBatch(db);
      shuffledSlots.forEach((prizeName, index) => {
        const posRef = doc(
          db,
          'campanhas',
          campanhaRef.id,
          'posicoes',
          `${index + 1}`
        );
        batch.set(posRef, {
          chance: index + 1,
          prize: prizeName,
          usado: false,
          enviado: false,
        });
      });

      await batch.commit();

      toast.success('Campanha criada e posições embaralhadas com sucesso!');
      // limpa form
      setNome('');
      setTotalRaspadinhas('');
      setPremios([{ nome: '', imagem: '', quantidadeTotais: 1 }]);
      router.push('/dashboard');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        <head>
          <title>Criar campanha - Pedidos da sorte </title>
        </head>
        <Container maxWidth="lg" sx={{ mt: 6 }}>
          <Typography component={'h1'} variant="h4" textAlign={'center'} gutterBottom>
            Criar nova campanha
          </Typography>
          <Grid container spacing={4} justifyContent="center" alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Nome da campanha"
                placeholder='ex: fim do mês'
                fullWidth
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                sx={{ mb: 2 }}
              />

              <TextField
                label="Total de raspadinhas"
                fullWidth
                type="number"
                value={totalRaspadinhas}
                onChange={e => {
                  const val = parseInt(e.target.value, 10);
                  // só atualiza se for ≥ 1
                  if (!isNaN(val) && val >= 1) {
                    setTotalRaspadinhas(val.toString());
                  }
                }}
                inputProps={{ step: 1, min: 1, pattern: '[1-9]*', inputMode: 'numeric' }}
                onKeyDown={e => ['e', 'E', '+', ',', '.', '-'].includes(e.key) && e.preventDefault()}
                sx={{ mb: 2 }}
              />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="modo-label">Modo da campanha</InputLabel>
                <Select
                  labelId="modo-label"
                  label="Modo da campanha"
                  value={modo}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onChange={e => setModo(e.target.value as any)}
                >
                  <MenuItem value="raspadinha">Número de jogos</MenuItem>
                  <MenuItem value="prazo">tempo</MenuItem>
                </Select>
              </FormControl>

              {modo === 'prazo' && (
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid size={6}>
                    <TextField
                      label="Data Início"
                      type="date"
                      fullWidth
                      inputProps={{ min: hoje }}
                      InputLabelProps={{ shrink: true }}
                      value={dataInicio}
                      onChange={e => setDataInicio(e.target.value)}
                    />
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      label="Data Fim"
                      type="date"
                      fullWidth
                      inputProps={{ min: dataInicio || hoje }}
                      InputLabelProps={{ shrink: true }}
                      value={dataFim}
                      onChange={e => setDataFim(e.target.value)}
                    />
                  </Grid>
                </Grid>
              )}

            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" gutterBottom>
                Prêmios
              </Typography>

              {premios.map((p, index) => (
                <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, sm: 5 }}>
                      <TextField
                        label="Nome do prêmio"
                        value={p.nome}
                        onChange={(e) => handleChangePremio(index, 'nome', e.target.value)}
                        fullWidth
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        label="Quantidade"
                        type="number"
                        value={p.quantidadeTotais}
                        onChange={(e) => handleChangePremio(index, 'quantidadeTotais', e.target.value)}
                        InputProps={{ endAdornment: <InputAdornment position="end">x</InputAdornment> }}
                        fullWidth
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }} sx={{ textAlign: 'center' }}>
                      <Box
                        component="label" // transforma em "label" para funcionar com <input type="file">
                        htmlFor={`upload-img-${index}`}
                        sx={{
                          cursor: 'pointer',
                          display: 'inline-block',
                        }}
                      >
                        {p.imagem ? (
                          <Box
                            component="img"
                            src={p.imagem}
                            alt={`Preview do prêmio ${index + 1}`}
                            sx={{
                              width: 200,
                              height: 200,
                              objectFit: 'cover',
                              borderRadius: 1,
                              border: '1px solid #ddd',
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: 80,
                              height: 80,
                              bgcolor: 'grey.100',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 1,
                              border: '1px dashed #ccc',
                              fontSize: 12,
                              color: 'text.secondary',
                            }}
                          >
                            Sem imagem
                          </Box>
                        )}
                      </Box>

                      {/* input hidden acoplado */}
                      <input
                        id={`upload-img-${index}`}
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </Grid>
                    {premios.length >= 3 ? (
                      <>
                        <Grid size={{ xs: 12, sm: 1 }} >
                          <IconButton onClick={() => removerPremio(index)}>
                            <FontAwesomeIcon icon={faMinus} />
                          </IconButton>
                        </Grid>
                      </>
                    ): null }
                  </Grid>
                </Box>
              ))}

              <Button
                onClick={adicionarPremio}
                variant="outlined"
                sx={{ mb: 4 }}
                startIcon={<FontAwesomeIcon icon={faPlus} />}
              >
                Adicionar prêmio
              </Button>
            </Grid>

            <Grid size={12}>
              <Divider sx={{ my: 4 }} />
            </Grid>


            <Grid size={{ xs: 12, md: 6 }}>
              <Box>Add Logo</Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }} display={'contents'}>
              <Button variant="contained" color='secondary' onClick={handleCancelar}>
                Canceler
              </Button>
              <Button variant="contained" onClick={criarCampanha}>
                Cadastrar
              </Button>

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
