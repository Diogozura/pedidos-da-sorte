'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, writeBatch, doc } from 'firebase/firestore';
import {
  Container,
  TextField,
  Typography,
  Button,
  Divider,
  IconButton,
  Box,
  Grid,
  InputAdornment,
} from '@mui/material';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';
import BaseDash from '../base';

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
  const [totalRaspadinhas, setTotalRaspadinhas] = useState('');
  const [premios, setPremios] = useState<Premio[]>([
    { nome: '', imagem: '', quantidadeTotais: 1 },
  ]);

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

    const total = parseInt(totalRaspadinhas, 10);
    const somaPremios = premios.reduce((sum, p) => sum + p.quantidadeTotais, 0);
    if (isNaN(total) || somaPremios > total) {
      toast.error('Total de raspadinhas deve ser ≥ soma das quantidades de prêmios.');
      return;
    }

    try {
      // 1. Cria a campanha
      const campanhasCol = collection(db, 'campanhas');
      const campanhaRef = await addDoc(campanhasCol, {
        nome,
        totalRaspadinhas: total,
        raspadinhasRestantes: total,
        premiosTotais: somaPremios,
        premiosRestantes: somaPremios,
        premios,
        criadoEm: new Date(),
      });

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error('Erro ao criar campanha: ' + err.message);
    }
  };

  return (
    <BaseDash>
      <Container maxWidth="sm" sx={{ mt: 6 }}>
        <Typography variant="h4" gutterBottom>
          Criar nova campanha
        </Typography>

        <TextField
          label="Nome da campanha"
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
          onChange={(e) => setTotalRaspadinhas(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Divider sx={{ my: 4 }} />

        <Typography variant="h6" gutterBottom>
          Prêmios
        </Typography>

        {premios.map((p, index) => (
          <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{xs:12, sm:4}}>
                <TextField
                  label="Nome do prêmio"
                  value={p.nome}
                  onChange={(e) => handleChangePremio(index, 'nome', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid size={{xs:12, sm:4}}>
                <TextField
                  label="Imagem (URL)"
                  value={p.imagem}
                  onChange={(e) => handleChangePremio(index, 'imagem', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid size={{xs:12, sm:2}}>
                <TextField
                  label="Quantidade"
                  type="number"
                  value={p.quantidadeTotais}
                  onChange={(e) => handleChangePremio(index, 'quantidadeTotais', e.target.value)}
                  InputProps={{ endAdornment: <InputAdornment position="end">x</InputAdornment> }}
                  fullWidth
                />
              </Grid>
              <Grid size={{xs:12, sm:2}} >
                <IconButton onClick={() => removerPremio(index)}>
                  <FontAwesomeIcon icon={faMinus} />
                </IconButton>
              </Grid>
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

        <Button variant="contained" fullWidth onClick={criarCampanha}>
          Criar campanha
        </Button>

        <Divider sx={{ mt: 4, mb: 2 }} />

        <Typography variant="body2" color="text.secondary">
          As campanhas agora pré-alocam posições aleatórias de prêmios em subcoleção `posicoes`.
        </Typography>
      </Container>
    </BaseDash>
  );
}
