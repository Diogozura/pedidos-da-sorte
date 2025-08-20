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
} from "@mui/material";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import DashboardCard from "@/components/DashboardCard";
import { useRouter } from "next/navigation";
import { EmailAuthProvider, onAuthStateChanged, reauthenticateWithCredential, updateEmail, updatePassword } from 'firebase/auth';
import BaseDash from '../base';
import { toast } from 'react-toastify';
import { faHome, faUserTie } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import AppBreadcrumbs from '@/components/shared/AppBreadcrumbs';
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
interface Usuario {
  uid: string;
  nome: string;
  email: string;
}

export default function GerenciarConta() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuarioLogado, setUsuarioLogado] = useState<{ uid: string, nivel: string } | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [modoEdicao, setModoEdicao] = useState<'email' | 'senha'>('email');
  const [novoValor, setNovoValor] = useState('');
  const [senhaAdmin, setSenhaAdmin] = useState('');
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();


  useEffect(() => {
    if (typeof window === 'undefined') return;

    const fetchUsuarios = async () => {
      onAuthStateChanged(auth, async (user) => {
        if (!user) return;

        const userRef = doc(db, 'usuarios', user.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();

        if (!userData) return;

        setUsuarioLogado({ uid: user.uid, nivel: userData.nivel });

        if (userData.nivel === 'admin') {
          const snap = await getDocs(collection(db, 'usuarios'));
          const lista: Usuario[] = snap.docs.map((doc) => ({
            uid: doc.id,
            nome: doc.data().nome || '',
            email: doc.data().email || '',
            nivel: doc.data().nivel || '',
            pizzariaId: doc.data().pizzariaId || '',
          }));
          setUsuarios(lista);
        }

        else if (userData.nivel === 'empresa') {
          const funcionariosQuery = query(
            collection(db, 'usuarios'),
            where('pizzariaId', '==', user.uid),
            where('nivel', '==', 'funcionario')
          );
          const funcionariosSnap = await getDocs(funcionariosQuery);

          const funcionarios: Usuario[] = funcionariosSnap.docs.map((doc) => ({
            uid: doc.id,
            nome: doc.data().nome || '',
            email: doc.data().email || '',
          }));

          const contaEmpresa: Usuario = {
            uid: user.uid,
            nome: userData.nome,
            email: userData.email,
          };

          setUsuarios([contaEmpresa, ...funcionarios]);
        }

        else {
          setUsuarios([{
            uid: user.uid,
            nome: userData.nome,
            email: userData.email,
          }]);
        }
      });
    };

    fetchUsuarios();
  }, []);




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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <BaseDash>
      <Container maxWidth="md" sx={{ mt: 6 }}>
        <AppBreadcrumbs
          items={[
            { label: 'Início', href: '/dashboard', icon: faHome },
            { label: 'Gerenciar conta', },
          ]}
        />
        <Typography variant="h4" gutterBottom>
          Gerenciar Conta
        </Typography>

        {(usuarioLogado?.nivel === 'admin' || usuarioLogado?.nivel === 'empresa') && (
          <Grid container spacing={4} sx={{ mb: 6 }}>
            <Grid size={{ xs: 12, md: 4 }} >
              <DashboardCard
                title={usuarioLogado?.nivel === 'admin' ? 'Cadastro Empresa' : 'Cadastrar Funcionário'}
                icon={<FontAwesomeIcon icon={faUserTie} />}
                onClick={() => router.push('/dashboard/empresa')}
              />
            </Grid>
          </Grid>
        )}
        {( usuarioLogado?.nivel === 'empresa') && (
          <Grid container spacing={4} sx={{ mb: 6 }}>
            <Grid size={{ xs: 12, md: 4 }} >
              <DashboardCard
                title='WhatsApp'
                icon={<FontAwesomeIcon icon={faWhatsapp} />}
                onClick={() => router.push('/dashboard/whatsApp')}
              />
            </Grid>
          </Grid>
        )}

        {usuarioLogado?.nivel === 'admin' ? (
          <>
            <Typography variant="h6" gutterBottom>Empresas</Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {usuarios
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .filter((u: any) => u.nivel === 'empresa')
                .map((usuario) => (
                  <Grid size={{ xs: 12, md: 4 }} key={usuario.uid}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight="bold">{usuario.nome}</Typography>
                        <Typography variant="body2" color="text.secondary">{usuario.email}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
            </Grid>

            <Typography variant="h6" gutterBottom>Colaborador</Typography>
            <Grid container spacing={2}>
              {usuarios
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .filter((u: any) => u.nivel === 'funcionario')
                .map((usuario) => (
                  <Grid size={{ xs: 12, md: 4 }} key={usuario.uid}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight="bold">{usuario.nome}</Typography>
                        <Typography variant="body2" color="text.secondary">{usuario.email}</Typography>
                        <Button size="small" onClick={() => abrirModal('email', usuario)}>Alterar Email</Button>
                        <Button size="small" onClick={() => abrirModal('senha', usuario)}>Alterar Senha</Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
            </Grid>
          </>
        ) : (
          <>
            <Typography variant="h6" gutterBottom>Contas cadastradas</Typography>
            <Grid container spacing={2}>
              {usuarios.map((usuario) => (
                <Grid size={{ xs: 12, md: 4 }} key={usuario.uid}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold">{usuario.nome}</Typography>
                      <Typography variant="body2" color="text.secondary">{usuario.email}</Typography>
                      {usuarioLogado?.nivel === 'empresa' ? (
                        <Typography variant="caption" color="text.secondary">
                          A edição deve ser feita pelo administrador.
                        </Typography>
                      ) : (
                        <>
                          <Button size="small" onClick={() => abrirModal('email', usuario)}>Alterar Email</Button>
                          <Button size="small" onClick={() => abrirModal('senha', usuario)}>Alterar Senha</Button>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}


        {/* MODAL DE ALTERAÇÃO */}
        <Dialog open={modalAberto} onClose={() => setModalAberto(false)}>
          <DialogTitle>
            {modoEdicao === 'email' ? 'Alterar Email' : 'Alterar Senha'}
          </DialogTitle>
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

      </Container>
    </BaseDash>
  );
}
