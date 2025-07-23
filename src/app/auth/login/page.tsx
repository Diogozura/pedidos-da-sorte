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
  Box
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

    try {
      const result = await signInWithEmailAndPassword(auth, email, senha);
      const user = result.user;

      // Verifica se o usuário está cadastrado no Firestore
      const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
      if (!userDoc.exists()) {
        await signOut(auth);
        toast.error('Essa conta não está cadastrada no sistema.');
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
        <Typography variant="h4" gutterBottom>
          Acessar conta
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

        <Button fullWidth variant="contained" onClick={loginEmailSenha}>
          Entrar
        </Button>
      </Container>
      <Box textAlign="center" mt={4}><Image width={100} height={40} src={'/Logo-original.png'} alt="Logo principal , Pedidos da sorte" /></Box>
    </>
  );
}
