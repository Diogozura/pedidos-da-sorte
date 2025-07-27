/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import {
  Button,
  Container,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
  Box,
  CircularProgress
} from '@mui/material';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';



export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ Se já estiver logado, redireciona para /dashboard
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
        if (userDoc.exists()) {
          router.push('/dashboard');
        } else {
          // caso esteja autenticado mas não esteja cadastrado
          await signOut(auth);
        }
      }
    });

    return () => unsubscribe();
  }, [router]);


  const loginEmailSenha = async () => {
    if (!email || !senha) {
      toast.error('Preencha o email e a senha!');
      return;
    }
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, senha);
      const user = result.user;

      // Verifica se o usuário está cadastrado no Firestore
      const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
      if (!userDoc.exists()) {
        await signOut(auth);
        toast.error('Essa conta não está cadastrada no sistema.');
        setLoading(false);
        return;
      }

      toast.success('Login realizado com sucesso! 🎉');
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err: any) {
      toast.error('Erro ao entrar: ' + err.message);
    }
  };

  return (
    <>

      <Container maxWidth="sm"
        sx={{
          height: '70vh',

          alignContent: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}>
        <Box textAlign="center" mb={4}><Image width={200} height={80} src={'/Logo-original.png'} alt="Logo principal , Pedidos da sorte" /></Box>
        <Typography variant="h4" gutterBottom>
          Área do Cliente
        </Typography>

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
        <Box display={'grid'} justifyContent={'space-around'}>
          <Button variant="contained" onClick={loginEmailSenha} sx={{ mb: 1 }}>
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Acessar'}
          </Button>
          <Button variant="contained" color='inherit'
           onClick={() => toast.info('Link de recuperação em breve!')}
          disabled={loading}
          >
            Esqueci minha senha
          </Button>
        </Box>

      </Container>

    </>
  );
}
