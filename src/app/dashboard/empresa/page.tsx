/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import ProtectedRoute from "@/components/ProtectedRoute";
import {
  Button,
  Container,
  TextField,
  Typography,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { auth, db } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { toast } from "react-toastify";

export default function GerenciarConta() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  // const [loading, setLoading] = useState(false); // opcional

  const handleCadastro = async () => {
    if (!nome || !email || !senha || !confirmarSenha) {
      toast.error('Preencha todos os campos!');
      return;
    }

    if (senha !== confirmarSenha) {
      toast.error('As senhas não coincidem!');
      return;
    }

    try {
      // setLoading(true); // opcional
      const result = await createUserWithEmailAndPassword(auth, email, senha);
      await updateProfile(result.user, { displayName: nome });

      await setDoc(doc(db, 'usuarios', result.user.uid), {
        uid: result.user.uid,
        nome,
        email,
        nivel: 'pizzaria',
        criadoEm: new Date(),
      });

      toast.success('Conta de pizzaria criada com sucesso!');
      // router.push('/dashboard/conta'); // opcional
    } catch (err: any) {
      toast.error('Erro ao cadastrar: ' + err.message);
    } finally {
      // setLoading(false); // opcional
    }
  };

  return (
    <ProtectedRoute>
      <Container maxWidth="sm" sx={{ mt: 6 }}>
        <Typography variant="h4" gutterBottom>
          Criar conta de pizzaria
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

        <Button
          fullWidth
          variant="contained"
          onClick={handleCadastro}
          // disabled={loading}
        >
          Cadastrar
        </Button>

      
      </Container>
    </ProtectedRoute>
  );
}
