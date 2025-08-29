'use client';

import ThemeToggleButton from '@/components/ThemeToggleButton';
import {
    AppBar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    Stack,
    Toolbar,
    Typography,
    useTheme,
} from '@mui/material';
import { logout } from '@/lib/logout';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Image from 'next/image';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

type Nivel = 'admin' | 'empresa' | 'funcionario';
type StatusConta = 'normal' | 'conta_limitada' | 'suspensa';

interface UsuarioDoc {
    nome?: string;
    email?: string;
    nivel?: Nivel;
    pizzariaId?: string;
    statusConta?: StatusConta;
    motivoLimitacao?: string;
}

export default function BaseDash({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const logoSrc = isDark ? '/Logo-preto.png' : '/Logo-original.png';

    const [checking, setChecking] = useState<boolean>(true);
    const [perfil, setPerfil] = useState<UsuarioDoc | null>(null);
    const [statusEmpresa, setStatusEmpresa] = useState<{ status?: StatusConta; motivo?: string } | null>(null);

    // redireciona quem não está logado
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!loading && !user) router.push('/auth/login');
    }, [user, loading, router]);

    // lê o perfil e (se funcionário) o status da empresa
    useEffect(() => {
        const run = async () => {
            if (!user) return;
            try {
                setChecking(true);
                const snap = await getDoc(doc(db, 'usuarios', user.uid));
                const data = snap.exists() ? (snap.data() as UsuarioDoc) : null;
                setPerfil(data);

                if (data?.nivel === 'funcionario' && data.pizzariaId) {
                    const empSnap = await getDoc(doc(db, 'usuarios', data.pizzariaId));
                    if (empSnap.exists()) {
                        const emp = empSnap.data() as UsuarioDoc;
                        setStatusEmpresa({ status: emp.statusConta, motivo: emp.motivoLimitacao });
                    } else {
                        setStatusEmpresa(null);
                    }
                } else {
                    setStatusEmpresa(null);
                }
            } finally {
                setChecking(false);
            }
        };
        run();
    }, [user]);

    const bloqueado = useMemo(() => {
        const selfStatus = perfil?.statusConta ?? 'normal';
        const blockSelf = selfStatus === 'conta_limitada' || selfStatus === 'suspensa';

        const empresaStatus = statusEmpresa?.status ?? 'normal';
        const blockEmpresa = empresaStatus === 'conta_limitada' || empresaStatus === 'suspensa';

        if (perfil?.nivel === 'funcionario') return blockEmpresa || blockSelf;
        return blockSelf;
        // se quiser que admin jamais fique bloqueado, use:
        // return perfil?.nivel === 'admin' ? false : blockSelf;
    }, [perfil, statusEmpresa]);

    const handleLogout = async () => {
        await logout();
        router.push('/auth/login');
    };

    if (loading || !user || checking) {
        return (
            <Container sx={{ mt: 4, textAlign: 'center' }}>
                <CircularProgress />
                <Typography sx={{ mt: 1 }}>Verificando acesso...</Typography>
            </Container>
        );
    }

    // Cabeçalho padrão (deixamos o usuário ver o topo, mas o conteúdo é bloqueado)
    const Header = (
        <AppBar position="static" color="default">
            <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box textAlign="center" mt={4}>
                    <Link href="/dashboard">
                        <Image width={150} height={51} src={logoSrc} alt="Logo principal , Pedidos da sorte" />
                    </Link>
                </Box>
                <Box display="flex" gap={2}>
                    <Button color="inherit" onClick={handleLogout}>
                        Sair
                    </Button>
                    <ThemeToggleButton />
                </Box>
            </Toolbar>
        </AppBar>
    );

    // TELA BLOQUEADA: não renderizamos {children}
    if (bloqueado) {
        const statusLabel =
            perfil?.nivel === 'funcionario'
                ? statusEmpresa?.status === 'conta_limitada'
                    ? 'conta limitada (empresa)'
                    : statusEmpresa?.status === 'suspensa'
                        ? 'suspensa (empresa)'
                        : (perfil?.statusConta ?? 'normal')
                : perfil?.statusConta ?? 'normal';

        const motivo =
            perfil?.nivel === 'funcionario'
                ? statusEmpresa?.motivo ?? 'restrição ativa'
                : perfil?.motivoLimitacao ?? 'restrição ativa';

        const chipColor: 'warning' | 'error' =
            (perfil?.nivel === 'funcionario' ? statusEmpresa?.status : perfil?.statusConta) === 'suspensa'
                ? 'error'
                : 'warning';

        return (
            <ProtectedRoute>
                {Header}
                <Container sx={{ mt: 6, display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
                    <Card sx={{ maxWidth: 560, width: '100%' }} variant="outlined">
                        <CardContent>
                            <Typography variant="h5" gutterBottom>
                                Acesso temporariamente bloqueado
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                Sua conta {perfil?.nivel === 'funcionario' ? 'ou a conta da sua empresa' : ''} está com restrições. Entre em contato com o administrador.
                            </Typography>

                            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                                <Chip label={`Status: ${statusLabel}`} color={chipColor} size="small" />
                                <Chip label={`Motivo: ${motivo}`} color='info' size="small" />
                            </Stack>

                            <Stack direction="column" spacing={1} justifyContent="flex-end">
                                {/* Se preferir, pode mandar para uma página de contato/suporte */}
                                <Typography component={'p'} variant='body2' fontWeight={'bold'}>Entre em contato com o administrador do pedido da sorte para que sua conta volta a funcionar normalmente </Typography>
                                <Button variant="contained" color="error" onClick={handleLogout}>
                                    Sair
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>
                </Container>

                <Box textAlign="center" mt={4}>
                    <Image width={150} height={51} src={logoSrc} alt="Logo principal , Pedidos da sorte" />
                </Box>
            </ProtectedRoute>
        );
    }

    // TELA LIBERADA
    return (
        <ProtectedRoute>
            {Header}
            {children}
            <Box textAlign="center" mt={4}>
                <Image width={150} height={51} src={logoSrc} alt="Logo principal , Pedidos da sorte" />
            </Box>
        </ProtectedRoute>
    );
}
