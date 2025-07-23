import ThemeToggleButton from "@/components/ThemeToggleButton";
import { Box, useTheme } from "@mui/material";
import Image from "next/image";

export function BaseSorteio({ children }: { children: React.ReactNode }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const logoSrc = isDark ? 'https://www.pedidodasorte.com.br/Logo-preto.png' : 'https://www.pedidodasorte.com.br/Logo-original.png';
    return (
        <> <Box display="flex" justifyContent="space-between" alignItems="center" px={2} py={1}> <Image width={100} height={40} src={logoSrc} alt="Logo principal , Pedidos da sorte" /> <ThemeToggleButton /></Box>

            {children}
            <Box textAlign="center" mt={4}><Image width={100} height={40} src={logoSrc} alt="Logo principal , Pedidos da sorte" /></Box>

        </>
    )
}   