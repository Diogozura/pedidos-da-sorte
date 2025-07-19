'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import {
  Container,
  TextField,
  Typography,
  Button,
  Divider,
  IconButton,
  Box,
  Grid,
  InputAdornment
} from '@mui/material';
import { toast } from 'react-toastify';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';
import BaseDash from '../base';

interface Premio {
  nome: string;
  imagem: string;
  quantidadeTotais: number;
  quantidadeRestantes: number;
}

export default function Sorteio() {
  const [nome, setNome] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [premios, setPremios] = useState<Premio[]>([
    { nome: '', imagem: '', quantidadeTotais: 1, quantidadeRestantes: 1 }
  ]);

  const adicionarPremio = () => {
    setPremios([...premios, { nome: '', imagem: '', quantidadeTotais: 1, quantidadeRestantes: 1 }]);
  };

  const removerPremio = (index: number) => {
    setPremios(premios.filter((_, i) => i !== index));
  };

  const handleChangePremio = (
    index: number,
    field: keyof Premio,
    value: string
  ) => {
    const novos = [...premios];
    if (field === 'quantidadeTotais') {
      const qt = parseInt(value) || 1;
      novos[index].quantidadeTotais = qt;
      // sincroniza quantidadeRestantes inicialmente igual ao total
      novos[index].quantidadeRestantes = qt;
    } else if (field === 'nome' || field === 'imagem') {
      novos[index][field] = value;
    }
    setPremios(novos);
  };

  const criarCampanha = async () => {
    if (!nome || !quantidade) {
      toast.error('Preencha todos os campos');
      return;
    }

    const total = parseInt(quantidade);
    // soma quantidades totais de cada prêmio
    const premiadasTotais = premios.reduce((sum, p) => sum + p.quantidadeTotais, 0);

    if (isNaN(total) || premiadasTotais > total) {
      toast.error('Dados inválidos. Verifique os valores.');
      return;
    }

    try {
      await addDoc(collection(db, 'campanhas'), {
        nome,
        totalRaspadinhas: total,
        raspadinhasRestantes: total,
        premiosTotais: premiadasTotais,
        premiosRestantes: premiadasTotais,
        premios,
        criadoEm: new Date()
      });

      toast.success('Campanha criada com sucesso!');
      setNome('');
      setQuantidade('');
      setPremios([{ nome: '', imagem: '', quantidadeTotais: 1, quantidadeRestantes: 1 }]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error('Erro ao salvar campanha: ' + err.message);
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
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Divider sx={{ my: 4 }} />

        <Typography variant="h6" gutterBottom>
          Prêmios
        </Typography>

        {premios.map((p, index) => (
          <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs:12, sm:4}} >
                <TextField
                  label="Nome do prêmio"
                  value={p.nome}
                  onChange={(e) => handleChangePremio(index, 'nome', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs:12, sm:4}}>
                <TextField
                  label="Imagem (URL)"
                  value={p.imagem}
                  onChange={(e) => handleChangePremio(index, 'imagem', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs:12, sm:2}}>
                <TextField
                  label="Quantidade"
                  type="number"
                  value={p.quantidadeTotais}
                  onChange={(e) => handleChangePremio(index, 'quantidadeTotais', e.target.value)}
                  InputProps={{ endAdornment: <InputAdornment position="end">x</InputAdornment> }}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs:12, sm:2}}>
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
          As campanhas são usadas para gerar raspadinhas com controle de prêmios e sorteios.
        </Typography>
      </Container>
    </BaseDash>
  );
}
