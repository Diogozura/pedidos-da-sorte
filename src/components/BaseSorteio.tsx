'use client';

import { Box, CircularProgress, Typography } from '@mui/material';
import Image from 'next/image';
import { useState } from 'react';

type Props = {
  children: React.ReactNode;
  logoUrl?: string;
  width?: number;
  height?: number;
  backgroundColor?: string;
  textColor?: string;
  // overlay de loading (controlado)
  loading?: boolean;
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
  // caso você queira poder “forçar” localmente sem prop
  const [_forceLoading] = useState(false);
  const showLoading = loading || _forceLoading;

  return (
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
      {/* Overlay tipo modal */}
      {showLoading && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: (theme) => theme.zIndex.modal + 1,
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(0,0,0,0.35)',       // escurece um pouco
            backdropFilter: 'blur(2px)',           // leve blur
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

      {/* Logo superior */}
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

      {/* Conteúdo */}
      <Box sx={{ flex: 1, width: '100%' }}>{children}</Box>

      {/* Footer/assinatura */}
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Image
          width={150}
          height={78}
          src="/logo-site.png"
          alt="Logo do site Pedidos da Sorte"
          loading="lazy"
          style={{ display: 'inline-block' }}
        />
      </Box>
    </Box>
  );
}
