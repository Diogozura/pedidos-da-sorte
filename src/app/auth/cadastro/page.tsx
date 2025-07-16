'use client';

import { auth, googleProvider } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { db } from '@/lib/firebase'; // Firestore importado
import { doc, setDoc, getDoc } from 'firebase/firestore';
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

  const salvarUsuarioNoFirestore = async (uid: string, nome: string, email: string) => {
    const ref = doc(db, 'usuarios', uid);
    await setDoc(ref, {
      nome,
      email,
      pizzariaId: null,
      nivel: 'admin', // ou 'pizzaria' dependendo do caso
      criadoEm: new Date(),
    });
  };

  const handleCadastro = async () => {
    if (!nome || !email || !senha) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      await updateProfile(userCredential.user, { displayName: nome });
      await salvarUsuarioNoFirestore(userCredential.user.uid, nome, email);
      toast.success('Conta criada com sucesso!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error('Erro ao cadastrar: ' + err.message);
    }
  };

  const cadastrarComGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const { email, uid, displayName } = result.user;

      if (!email) {
        toast.error('Erro ao obter email da conta Google.');
        return;
      }

      // Verifica se já está no banco de dados
      const ref = doc(db, 'usuarios', uid);
      const snapshot = await getDoc(ref);

      if (snapshot.exists()) {
        toast.error('Essa conta já está cadastrada!');
        return;
      }

      await salvarUsuarioNoFirestore(uid, displayName || 'Sem nome', email);
      toast.success('Conta com Google criada com sucesso!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error('Erro ao cadastrar com Google: ' + err.message);
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
        value={nome}
        sx={{ mb: 2 }}
        onChange={(e) => setNome(e.target.value)}
      />
      <TextField
        fullWidth
        label="Email"
        type="email"
        value={email}
        sx={{ mb: 2 }}
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextField
        fullWidth
        label="Senha"
        type="password"
        value={senha}
        sx={{ mb: 2 }}
        onChange={(e) => setSenha(e.target.value)}
      />

      <Button fullWidth variant="contained" onClick={handleCadastro}>
        Cadastrar
      </Button>

      <Divider sx={{ my: 3 }}>ou</Divider>

      <Button fullWidth variant="outlined" onClick={cadastrarComGoogle}>
        Cadastrar com Google
      </Button>

      <Button
        fullWidth
        variant="text"
        sx={{ mt: 2 }}
        onClick={() => router.push('/login')}
      >
        Já tenho conta
      </Button>
    </Container>
  );
}
