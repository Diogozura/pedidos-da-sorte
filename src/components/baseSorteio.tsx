'use client';

import { darkTheme } from "@/theme/theme";
import { Box } from "@mui/material";
import Image from "next/image";
import { useEffect } from "react";




export function BaseSorteio({ children }: { children: React.ReactNode }) {
    useEffect(() => {
    // Aplica o fundo do body manualmente (opcional, mas ajuda se tiver conteúdo fora do MUI)
    document.body.style.backgroundColor = darkTheme.palette.background.default;
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, []);
    return (
        <>
            <Box display="flex" justifyContent="center" alignItems="center" px={2} py={1}>
                <Image width={100} height={40} src={'/Logo-preto.png'} alt="Logo principal , Pedidos da sorte" />
            </Box>

            {children}

            <Box textAlign="center" mt={4}>
                <Image width={100} height={40} src={'/Logo-preto.png'} alt="Logo principal , Pedidos da sorte" />
            </Box>
        </>
    );
}
