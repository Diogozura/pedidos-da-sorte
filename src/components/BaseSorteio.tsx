'use client';

import { darkTheme } from "@/theme/theme";
import { Box } from "@mui/material";
import Image from "next/image";
import { useEffect } from "react";




export function BaseSorteio({ children , logoUrl }: { children: React.ReactNode , logoUrl?: string }) {
    useEffect(() => {
    // Aplica o fundo do body manualmente (opcional, mas ajuda se tiver conteúdo fora do MUI)
    document.body.style.backgroundColor = darkTheme.palette.background.default;
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, []);
    return (
        <>
            <Box display="flex" justifyContent="center" alignItems="center">
                <Image width={200} height={200} src={ logoUrl || '/sua-logo.png'} alt="Logo principal , Pedidos da sorte" />
            </Box>
            {children}
            <Box textAlign="center" mt={4}>
                <Image width={150} height={78} src={'/logo-site.png'} alt="Logo principal , Pedidos da sorte" />
            </Box>
        </>
    );
}
