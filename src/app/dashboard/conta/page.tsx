'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
} from '@mui/material';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import DashboardCard from '@/components/DashboardCard';
import { useRouter } from 'next/navigation';
import {
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
} from 'firebase/auth';
import BaseDash from '../base';
import { toast } from 'react-toastify';
import { faHome, faPen, faUser, faUserFriends, faUserTie } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import AppBreadcrumbs from '@/components/shared/AppBreadcrumbs';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';

type NivelUsuario = 'admin' | 'empresa' | 'funcionario';
type StatusConta = 'normal' | 'conta_limitada' | 'suspensa';

interface Usuario {
  uid: string;
  nome: string;
  email: string;
  nivel?: NivelUsuario;
  pizzariaId?: string;
  statusConta?: StatusConta;
  motivoLimitacao?: string;
}

export default function GerenciarConta() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuarioLogado, setUsuarioLogado] = useState<{ uid: string; nivel: NivelUsuario; nome: string } | null>(null);

  // modal alterar email/senha (já existente)
  const [modalAberto, setModalAberto] = useState(false);
  const [modoEdicao, setModoEdicao] = useState<'email' | 'senha'>('email');
  const [novoValor, setNovoValor] = useState('');
  const [senhaAdmin, setSenhaAdmin] = useState('');
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(false);

  // modal limitar conta (novo)
  const [limitarModalAberto, setLimitarModalAberto] = useState(false);
  const [statusSelecionado, setStatusSelecionado] = useState<StatusConta | ''>('');
  const [motivoSelecionado, setMotivoSelecionado] = useState<string>('');
  const [confirmarModalAberto, setConfirmarModalAberto] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const userRef = doc(db, 'usuarios', user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data() as { nivel?: NivelUsuario; nome?: string; email?: string } | undefined;

      if (!userData?.nivel || !userData?.nome) return;

      setUsuarioLogado({ uid: user.uid, nivel: userData.nivel, nome: userData.nome });

      if (userData.nivel === 'admin') {
        const snap = await getDocs(collection(db, 'usuarios'));
        const lista: Usuario[] = snap.docs.map((d) => {
          const data = d.data() as Partial<Usuario>;
          return {
            uid: d.id,
            nome: (data.nome ?? '') as string,
            email: (data.email ?? '') as string,
            nivel: data.nivel,
            pizzariaId: data.pizzariaId,
            statusConta: (data.statusConta ?? 'normal') as StatusConta,
            motivoLimitacao: data.motivoLimitacao,
          };
        });
        setUsuarios(lista);
      } else if (userData.nivel === 'empresa') {
        const funcionariosQuery = query(
          collection(db, 'usuarios'),
          where('pizzariaId', '==', user.uid),
          where('nivel', '==', 'funcionario')
        );
        const funcionariosSnap = await getDocs(funcionariosQuery);

        const funcionarios: Usuario[] = funcionariosSnap.docs.map((d) => {
          const data = d.data() as Partial<Usuario>;
          return {
            uid: d.id,
            nome: (data.nome ?? '') as string,
            email: (data.email ?? '') as string,
            statusConta: (data.statusConta ?? 'normal') as StatusConta,
            motivoLimitacao: data.motivoLimitacao,
          };
        });

        const contaEmpresa: Usuario = {
          uid: user.uid,
          nome: userData.nome,
          email: userData.email ?? '',
          statusConta: 'normal',
        };

        setUsuarios([contaEmpresa, ...funcionarios]);
      } else {
        const conta: Usuario = {
          uid: user.uid,
          nome: userData.nome,
          email: userData.email ?? '',
          statusConta: 'normal',
        };
        setUsuarios([conta]);
      }
    });

    return () => unsubscribe();
  }, []);

  // ---- Alterar email/senha (já existente) ----
  const abrirModal = (modo: 'email' | 'senha', usuario: Usuario) => {
    setModoEdicao(modo);
    setUsuarioSelecionado(usuario);
    setModalAberto(true);
  };

  const alterarDado = async () => {
    if (!usuarioSelecionado || !auth.currentUser) return;

    try {
      setCarregando(true);
      const credencial = EmailAuthProvider.credential(auth.currentUser.email || '', senhaAdmin);
      await reauthenticateWithCredential(auth.currentUser, credencial);

      if (modoEdicao === 'email') {
        await updateEmail(auth.currentUser, novoValor);
        await updateDoc(doc(db, 'usuarios', usuarioSelecionado.uid), { email: novoValor });
        toast.success('Email atualizado com sucesso!');
      } else {
        await updatePassword(auth.currentUser, novoValor);
        toast.success('Senha atualizada com sucesso!');
      }

      setModalAberto(false);
      setNovoValor('');
      setSenhaAdmin('');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(msg);
    } finally {
      setCarregando(false);
    }
  };

  // ---- Limitar conta (NOVO) ----
  const abrirModalLimitarConta = (usuario: Usuario) => {
    setUsuarioSelecionado(usuario);
    // Pré-seleciona o status atual caso exista
    setStatusSelecionado(usuario.statusConta ?? 'conta_limitada');
    setMotivoSelecionado(usuario.motivoLimitacao ?? '');
    setLimitarModalAberto(true);
  };

  const motivosPadrao: string[] = [
    'pagamento atrasado de plano',
    'uso indevido da plataforma',
    'suspeita de fraude',
    'solicitação do cliente',
    'outros',
  ];

  const confirmarLimite = () => {
    if (!statusSelecionado || !motivoSelecionado) {
      toast.error('Selecione o status e o motivo.');
      return;
    }
    setConfirmarModalAberto(true);
  };

  const aplicarLimite = async () => {
    if (!usuarioSelecionado) return;

    try {
      setCarregando(true);
      await updateDoc(doc(db, 'usuarios', usuarioSelecionado.uid), {
        statusConta: statusSelecionado,
        motivoLimitacao: motivoSelecionado,
        atualizadoEm: serverTimestamp(),
      });
      toast.success('Status da conta atualizado com sucesso!');
      // Atualiza na lista local
      setUsuarios((prev) =>
        prev.map((u) =>
          u.uid === usuarioSelecionado.uid
            ? { ...u, statusConta: statusSelecionado as StatusConta, motivoLimitacao: motivoSelecionado }
            : u
        )
      );
      setConfirmarModalAberto(false);
      setLimitarModalAberto(false);
      setUsuarioSelecionado(null);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao atualizar status da conta';
      toast.error(msg);
    } finally {
      setCarregando(false);
    }
  };

  const ehAdmin = usuarioLogado?.nivel === 'admin';

  console.log('usuarios', usuarios);

  return (
    <BaseDash>
      <Container maxWidth="md" sx={{ mt: 6 }}>
        <AppBreadcrumbs
          items={[
            { label: 'Início', href: '/dashboard', icon: faHome },
            { label: 'Gerenciar conta' },
          ]}
        />
        <Typography variant="h4" gutterBottom>
          Gerenciar Conta
        </Typography>

        <Grid container spacing={2}>

          {(usuarioLogado?.nivel === 'admin' || usuarioLogado?.nivel === 'empresa') && (
            <Grid container spacing={4} sx={{ mb: 6 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <DashboardCard
                  title={usuarioLogado?.nivel === 'admin' ? 'Cadastro Empresa' : 'Cadastrar Colaborador'}
                  icon={<FontAwesomeIcon icon={faUserTie} />}
                  onClick={() => router.push('/dashboard/cadastrar-usuario')}
                />
              </Grid>
            </Grid>
          )}
          {usuarioLogado?.nivel === 'empresa' && (
            <Grid container spacing={4} sx={{ mb: 6 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <DashboardCard
                  title="WhatsApp"
                  color="vermelho"
                  icon={<FontAwesomeIcon icon={faWhatsapp} />}
                  onClick={() => router.push('/dashboard/whatsApp')}
                />
              </Grid>
            </Grid>
          )}
        </Grid>

        {ehAdmin ? (
          <>
            <Typography variant="h6" gutterBottom>
              Empresas
            </Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {usuarios
                .filter((u) => u.nivel === 'empresa')
                .map((usuario) => (
                  <Grid size={{ xs: 12, md: 4 }} key={usuario.uid}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {usuario.nome}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {usuario.email}
                        </Typography>

                        <Stack direction="row" spacing={1} sx={{ my: 1 }}>
                          <Chip
                            label={usuario.statusConta === 'conta_limitada' ? 'conta limitada' : usuario.statusConta ?? 'normal'}
                            color={usuario.statusConta === 'conta_limitada' ? 'warning' : usuario.statusConta === 'suspensa' ? 'error' : 'default'}
                            size="small"
                          />
                          {usuario.motivoLimitacao && <Chip label={usuario.motivoLimitacao} size="small" />}
                        </Stack>

                        <Button
                          color="error"
                          variant="outlined"
                          size="small"
                          onClick={() => abrirModalLimitarConta(usuario)}
                        >
                          Limitar conta
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
            </Grid>

            <Typography variant="h6" gutterBottom>
              Colaborador
            </Typography>
            <Grid container spacing={2}>
              {usuarios
                .filter((u) => u.nivel === 'funcionario')
                .map((usuario) => (
                  <Grid size={{ xs: 12, md: 4 }} key={usuario.uid}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {usuario.nome}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {usuario.email}
                        </Typography>
                        <Button size="small" onClick={() => abrirModal('email', usuario)}>
                          Alterar Email
                        </Button>
                        <Button size="small" onClick={() => abrirModal('senha', usuario)}>
                          Alterar Senha
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
            </Grid>
          </>
        ) : (
          <>
            <Typography variant="h6" gutterBottom>
              Colaborador <FontAwesomeIcon icon={faUserFriends} />
            </Typography>
            <Grid container spacing={2}>
              {usuarios
                .filter((usuario) => usuario.uid !== usuarioLogado?.uid)
                .map((usuario) => (
                  <Grid key={usuario.uid} size={{ xs: 12, md: 6 }}>
                    <DashboardCard
                      title={usuario.nome}
                      titleIcon={<FontAwesomeIcon icon={faPen} />} // NOVO
                      color="vermelho"
                      icon={<FontAwesomeIcon icon={faUser} />}
                      onClick={() => router.push('/dashboard/conta/#')}
                    />
                  </Grid>
                ))}
            </Grid>
          </>
        )}

        {/* MODAL DE ALTERAÇÃO (EMAIL/SENHA) */}
        <Dialog open={modalAberto} onClose={() => setModalAberto(false)}>
          <DialogTitle>{modoEdicao === 'email' ? 'Alterar Email' : 'Alterar Senha'}</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label={modoEdicao === 'email' ? 'Novo Email' : 'Nova Senha'}
              sx={{ my: 2 }}
              value={novoValor}
              onChange={(e) => setNovoValor(e.target.value)}
            />
            <TextField
              fullWidth
              label="Confirme sua senha de admin"
              type="password"
              value={senhaAdmin}
              onChange={(e) => setSenhaAdmin(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setModalAberto(false)}>Cancelar</Button>
            <Button variant="contained" onClick={alterarDado} disabled={carregando}>
              {carregando ? <CircularProgress size={20} /> : 'Salvar'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* MODAL LIMITAR CONTA (NOVO) */}
        <Dialog open={limitarModalAberto} onClose={() => setLimitarModalAberto(false)}>
          <DialogTitle>Limitar conta (apenas admin)</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel size="small">Status da conta</InputLabel>
              <Select
                size="small"
                label="Status da conta"
                value={statusSelecionado}
                onChange={(e) => setStatusSelecionado(e.target.value as StatusConta)}
              >
                <MenuItem value="normal">normal</MenuItem>
                <MenuItem value="conta_limitada">conta limitada</MenuItem>
                <MenuItem value="suspensa">suspensa</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel size="small">Motivo</InputLabel>
              <Select
                size="small"
                label="Motivo"
                value={motivoSelecionado}
                onChange={(e) => setMotivoSelecionado(e.target.value)}
              >
                {motivosPadrao.map((m) => (
                  <MenuItem key={m} value={m}>
                    {m}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography variant="caption" sx={{ display: 'block', mt: 2 }} color="text.secondary">
              Ex.: status conta: “conta limitada”, motivo: “pagamento atrasado de plano”.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLimitarModalAberto(false)}>Cancelar</Button>
            <Button
              variant="contained"
              color="warning"
              onClick={confirmarLimite}
              disabled={!statusSelecionado || !motivoSelecionado || carregando}
            >
              Prosseguir
            </Button>
          </DialogActions>
        </Dialog>

        {/* CONFIRMAÇÃO DA AÇÃO */}
        <Dialog open={confirmarModalAberto} onClose={() => setConfirmarModalAberto(false)}>
          <DialogTitle>Confirmar ação</DialogTitle>
          <DialogContent>
            <Typography>
              Você tem certeza que deseja realizar essa ação?
            </Typography>
            <Stack spacing={1} sx={{ mt: 2 }}>
              <Chip
                label={`Status: ${statusSelecionado === 'conta_limitada' ? 'conta limitada' : statusSelecionado
                  }`}
                size="small"
              />
              <Chip label={`Motivo: ${motivoSelecionado}`} size="small" />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmarModalAberto(false)}>Cancelar</Button>
            <Button
              variant="contained"
              color="error"
              onClick={aplicarLimite}
              disabled={carregando}
            >
              {carregando ? <CircularProgress size={20} /> : 'Confirmar'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </BaseDash>
  );
}
