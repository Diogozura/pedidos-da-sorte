'use client';

import { auth } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import {
  Button,
  Container,
  TextField,
  Typography,
  Divider,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'react-toastify';

export default function CadastroPage() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleCadastro = async () => {
    if (!nome || !email || !senha) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);

      // Opcional: salvar nome do usuário
      await updateProfile(userCredential.user, { displayName: nome });

      toast.success('Cadastro realizado com sucesso! 🎉');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error('Erro ao cadastrar: ' + error.message);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Typography variant="h4" gutterBottom>
        Criar conta
      </Typography>

      <TextField
        fullWidth
        label="Nome completo"
        sx={{ mb: 2 }}
        onChange={(e) => setNome(e.target.value)}
      />
      <TextField
        fullWidth
        label="Email"
        type="email"
        sx={{ mb: 2 }}
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextField
        fullWidth
        label="Senha"
        type="password"
        sx={{ mb: 2 }}
        onChange={(e) => setSenha(e.target.value)}
      />

      <Button fullWidth variant="contained" onClick={handleCadastro}>
        Cadastrar
      </Button>

      <Divider sx={{ my: 3 }}>ou</Divider>

      <Button fullWidth variant="outlined" onClick={() => router.push('/login')}>
        Já tenho conta
      </Button>
    </Container>
  );
}
