/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import {
  Button,
  Container,
  TextField,
  Typography,
  InputAdornment,
  IconButton,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faHome } from "@fortawesome/free-solid-svg-icons";
import { auth, db } from "@/lib/firebase";

import { collection, getDocs } from "firebase/firestore";
import { toast } from "react-toastify";
import BaseDash from "../base";

import ProtegePagina from '@/components/ProtegePagina';
import { useUsuarioLogado } from "@/hook/useUsuarioLogado";
import AppBreadcrumbs from "@/components/shared/AppBreadcrumbs";

export default function GerenciarConta() {
  const { usuario } = useUsuarioLogado();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [nivel, setNivel] = useState<'empresa' | 'funcionario'>('empresa');
  const [pizzarias, setPizzarias] = useState<{ id: string, nome: string }[]>([]);
  const [pizzariaSelecionada, setPizzariaSelecionada] = useState<string>('');
   const router = useRouter();
  useEffect(() => {
    const buscarEmpresas = async () => {
      const snap = await getDocs(collection(db, 'usuarios'));
      const lista = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((u: any) => u.nivel === 'empresa')
        .map((u: any) => ({ id: u.uid, nome: u.nome }));

      setPizzarias(lista);
    };

    if (usuario?.nivel === 'admin') buscarEmpresas();
  }, [usuario]);

  useEffect(() => {
    if (usuario?.nivel === 'empresa') {
      setNivel('funcionario');
    }
  }, [usuario]);

  const handleCadastro = async () => {
  if (!nome || !email || !senha || !confirmarSenha) {
    toast.error('Preencha todos os campos!');
    return;
  }
  if (senha !== confirmarSenha) {
    toast.error('As senhas não coincidem!');
    return;
  }
  if (!usuario) {
    toast.error('Usuário não autenticado.');
    return;
  }
  if (nivel === 'funcionario' && usuario.nivel === 'admin' && !pizzariaSelecionada) {
    toast.error('Selecione a pizzaria do funcionário.');
    return;
  }

  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      toast.error('Falha ao obter token de autenticação.');
      return;
    }

    const res = await fetch('/api/usuarios/criar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        nome,
        email,
        senha,
        nivel,
        pizzariaId: nivel === 'funcionario' && usuario.nivel === 'admin' ? pizzariaSelecionada : undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data?.ok) {
      throw new Error(data?.error || 'Erro ao cadastrar');
    }

    toast.success(`Usuário ${nivel === 'empresa' ? 'empresa' : 'colaborador'} criado com sucesso!`);
    router.push('/dashboard/conta');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    toast.error('Erro ao cadastrar: ' + msg);
  }
};

  return (
    <ProtegePagina permitido={['admin', 'empresa']}>
      <BaseDash>
        <Container maxWidth="md" sx={{ mt: 6 }}>
          <AppBreadcrumbs
            items={[
              { label: 'Início', href: '/dashboard', icon: faHome },
              { label: 'Gerenciar Códigos', href: '/dashboard/conta' },
              { label: 'Cadastrar novo usuário', },
            ]}
          />
        </Container>
        <Container maxWidth="sm" sx={{ mt: 6 }}>

          <Typography variant="h4" gutterBottom>
            Cadastrar novo usuário
          </Typography>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="nivel-label">Nível de acesso</InputLabel>
            <Select
              labelId="nivel-label"
              value={nivel}
              label="Nível de acesso"
              onChange={(e: SelectChangeEvent) => setNivel(e.target.value as any)}
              disabled={usuario?.nivel === 'empresa'}
            >
              {usuario?.nivel === 'admin' && <MenuItem value="empresa">Empresa</MenuItem>}
              <MenuItem value="funcionario">Colaborador</MenuItem>
            </Select>
          </FormControl>

          {nivel === 'funcionario' && usuario?.nivel === 'admin' && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="pizzaria-label">Pizzaria</InputLabel>
              <Select
                labelId="pizzaria-label"
                value={pizzariaSelecionada}
                label="Pizzaria"
                onChange={(e: SelectChangeEvent) => setPizzariaSelecionada(e.target.value)}
              >
                {pizzarias.map((pizzaria) => (
                  <MenuItem key={pizzaria.id} value={pizzaria.id}>
                    {pizzaria.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

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
        </Container>
      </BaseDash>
    </ProtegePagina>
  );
}
