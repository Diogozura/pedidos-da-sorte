import ThemeToggleButton from "@/components/ThemeToggleButton";
import { AppBar, Box, Button, CircularProgress, Container, Toolbar, Typography, useTheme } from "@mui/material";
import { logout } from '@/lib/logout';
import { useAuth } from "@/context/AuthContext";
import { useRouter } from 'next/navigation';
import { useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Image from "next/image";


export default function BaseDash({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const logoSrc = isDark ? '/Logo-preto.png' : '/Logo-original.png';
    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (!loading && !user) {
                router.push('/auth/login');
            }
        }

    }, [user, loading, router]);

    if (loading || !user) {
        return (
            <Container sx={{ mt: 4, textAlign: 'center' }}>
                <CircularProgress />
                <Typography>Verificando acesso...</Typography>
            </Container>
        );
    }

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };
    return (
        <ProtectedRoute>
            {/* Header */}
            <AppBar position="static" sx={{ backgroundColor: '#BA0100' }}>
                <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6">Bem-vindo, {user?.email}</Typography>
                    <Box display="flex" gap={2}>
                        <Button color="inherit" onClick={() => router.push('/dashboard')}>
                            Dashboard
                        </Button>
                        <Button color="inherit" onClick={() => router.push('/dashboard/promocoes')}>
                            Promoção
                        </Button>
                        <Button color="inherit" onClick={() => router.push('/dashboard/jogos')}>
                            Jogos
                        </Button>
                        <Button color="inherit" onClick={handleLogout}>
                            Sair
                        </Button>
                        <ThemeToggleButton />
                    </Box>
                </Toolbar>
            </AppBar>
            {children}
            <Box textAlign="center" mt={4}><Image width={100} height={40} src={logoSrc} alt="Logo principal , Pedidos da sorte" /></Box>

        </ProtectedRoute>
    )
}