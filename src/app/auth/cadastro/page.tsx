'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Container,
  TextField,
  Typography,
  Divider,
} from '@mui/material';
import { toast } from 'react-toastify';

import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'
import { IconButton, InputAdornment } from '@mui/material';


export default function CadastroPage() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');


  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const handleCadastro = async () => {
    if (!nome || !email || !senha) {
      toast.error('Preencha todos os campos!');
      return;
    }


    try {
      const result = await createUserWithEmailAndPassword(auth, email, senha);
      await updateProfile(result.user, { displayName: nome });

      // Salva os dados no Firestore (coleção: usuarios)
      await setDoc(doc(db, 'usuarios', result.user.uid), {
        uid: result.user.uid,
        nome,
        email,
        criadoEm: new Date(),
        nivel: 'pizzaria', // ou 'admin' se quiser diferenciar
      });

      toast.success('Conta criada com sucesso!');
      setTimeout(() => router.push('/dashboard'), 1500);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error('Erro ao cadastrar: ' + err.message);
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
        value={nome}
        onChange={(e) => setNome(e.target.value)}
      />
      <TextField
        fullWidth
        label="Email"
        type="email"
        sx={{ mb: 2 }}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextField
        fullWidth
        label="Senha"
        type={mostrarSenha ? 'text' : 'password'}
        sx={{ mb: 2 }}
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setMostrarSenha(!mostrarSenha)} edge="end">
                <FontAwesomeIcon icon={mostrarSenha ? faEyeSlash : faEye} />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <TextField
        fullWidth
        label="Confirmar Senha"
        type={mostrarSenha ? 'text' : 'password'}
        sx={{ mb: 2 }}
        value={confirmarSenha}
        onChange={(e) => setConfirmarSenha(e.target.value)}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setMostrarSenha(!mostrarSenha)} edge="end">
                <FontAwesomeIcon icon={mostrarSenha ? faEyeSlash : faEye} />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <Button fullWidth variant="contained" onClick={handleCadastro}>
        Cadastrar
      </Button>

      <Divider sx={{ my: 3 }} />

      <Button
        fullWidth
        variant="text"
        onClick={() => router.push('/auth/login')}
      >
        Já tenho conta
      </Button>
    </Container>
  );
}
