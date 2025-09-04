'use client';

import { Box, CircularProgress, Typography } from '@mui/material';
import Image from 'next/image';
import { useState, createContext, useContext, useEffect } from 'react';

type Ctx = { setLoading: (v: boolean) => void };
const BaseSorteioLoadingCtx = createContext<Ctx | null>(null);
export function useBaseSorteioLoading() {
  const ctx = useContext(BaseSorteioLoadingCtx);
  if (!ctx) throw new Error('useBaseSorteioLoading precisa estar dentro do <BaseSorteio>');
  return ctx;
}

type Props = {
  children: React.ReactNode;
  logoUrl?: string;
  width?: number;
  height?: number;
  backgroundColor?: string;
  textColor?: string;
  loading?: boolean;        // estado inicial vindo da page
  loadingText?: string;
};

export function BaseSorteio({
  children,
  logoUrl,
  width = 150,
  height = 150,
  backgroundColor = '#b30000',
  textColor = '#ffffff',
  loading = false,
  loadingText = 'Carregando...',
}: Props) {
  const [isLoading, setIsLoading] = useState<boolean>(loading);

  // se a prop "loading" mudar por algum motivo, sincroniza
  useEffect(() => setIsLoading(loading), [loading]);

  

  return (
    <BaseSorteioLoadingCtx.Provider value={{ setLoading: setIsLoading }}>
      <Box
        sx={{
          minHeight: '100dvh',
          bgcolor: backgroundColor,
          color: textColor,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pt: 2,
          position: 'relative',
          overflow: 'clip',
        }}
      >
        {logoUrl && (
          <Image
            src={logoUrl}
            alt="Logo da campanha"
            width={width}
            height={height}
            priority
            style={{ display: 'block', marginBottom: '1rem', borderRadius: 16 }}
          />
        )}

        <Box sx={{ flex: 1, width: '100%' }}>{children}</Box>

        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Image width={150} height={78} src="/logo-site.png" alt="Logo do site Pedidos da Sorte" loading="lazy" />
        </Box>

        {isLoading && (
          <Box
            id="basesorteio-overlay"
            sx={{
              position: 'fixed',
              inset: 0,
              zIndex: (t) => t.zIndex.modal + 1,
              display: 'grid',
              placeItems: 'center',
              background: 'rgba(0,0,0,0.35)',
              backdropFilter: 'blur(2px)',
            }}
          >
            <Box
              sx={{
                minWidth: 220,
                px: 3,
                py: 3,
                borderRadius: 3,
                bgcolor: 'rgba(0,0,0,0.55)',
                color: '#fff',
                display: 'grid',
                gap: 1.5,
                justifyItems: 'center',
                boxShadow: 4,
              }}
            >
              <CircularProgress size={36} sx={{ color: '#fff' }} />
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {loadingText}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </BaseSorteioLoadingCtx.Provider>
  );
}
