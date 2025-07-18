'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import {
  Container,
  TextField,
  Typography,
  Button,
  Divider
} from '@mui/material';
import { toast } from 'react-toastify';

export default function Sorteio() {
  const [nome, setNome] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [premiadas, setPremiadas] = useState('');

  const criarCampanha = async () => {
    if (!nome || !quantidade || !premiadas) {
      toast.error('Preencha todos os campos');
      return;
    }

    const total = parseInt(quantidade);
    const premiadasNum = parseInt(premiadas);

    if (isNaN(total) || isNaN(premiadasNum) || premiadasNum > total) {
      toast.error('Dados inválidos. Verifique os valores.');
      return;
    }

    try {
      await addDoc(collection(db, 'campanhas'), {
        nome,
        totalRaspadinhas: total,
        raspadinhasRestantes: total,
        premiadasTotais: premiadasNum,
        premiadasRestantes: premiadasNum,
        criadoEm: new Date()
      });

      toast.success('Campanha criada com sucesso!');
      setNome('');
      setQuantidade('');
      setPremiadas('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error('Erro ao salvar campanha: ' + err.message);
    }
  };

  return (
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

      <TextField
        label="Quantidade premiada"
        fullWidth
        type="number"
        value={premiadas}
        onChange={(e) => setPremiadas(e.target.value)}
        sx={{ mb: 2 }}
      />

      <Button variant="contained" fullWidth onClick={criarCampanha}>
        Criar campanha
      </Button>

      <Divider sx={{ mt: 4, mb: 2 }} />

      <Typography variant="body2" color="text.secondary">
        As campanhas são usadas para gerar raspadinhas com controle de prêmios e sorteios.
      </Typography>
    </Container>
  );
}
