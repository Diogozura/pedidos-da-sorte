import ThemeToggleButton from "@/components/ThemeToggleButton";
import { AppBar, Box, Button, CircularProgress, Container, Toolbar, Typography, useTheme } from "@mui/material";
import { logout } from '@/lib/logout';
import { useAuth } from "@/context/AuthContext";
import { useRouter } from 'next/navigation';
import { useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Image from "next/image";
import Link from "next/link";


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
            <AppBar position="static" color="default">
                <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
                   <Box textAlign="center" mt={4}> <Link href={'/dashboard'}><Image width={150} height={51} src={logoSrc} alt="Logo principal , Pedidos da sorte" /></Link></Box>
                    <Box display="flex" gap={2}>
                        <Button color="inherit" onClick={handleLogout}>
                            Sair
                        </Button>
                        <ThemeToggleButton />
                    </Box>
                </Toolbar>
            </AppBar>
            {children}
            <Box textAlign="center" mt={4}><Image width={150} height={51} src={logoSrc} alt="Logo principal , Pedidos da sorte" /></Box>

        </ProtectedRoute>
    )
}