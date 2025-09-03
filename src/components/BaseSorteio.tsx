'use client';

import { Box } from "@mui/material";
import Image from "next/image";
import { useMemo, useState } from "react";

type Props = {
  children: React.ReactNode;
  logoUrl?: string;
  width?: number;
  height?: number;
  backgroundColor?: string;
  textColor?: string;
};

export function BaseSorteio({
  children,
  logoUrl,
  width = 150,
  height = 150,
  backgroundColor = "#b30000",
  textColor = "#ffffff",
}: Props) {
  // Resolve cores já no 1º render (evita flicker)
  const colors = useMemo(
    () => ({ bg: backgroundColor, fg: textColor }),
    [backgroundColor, textColor]
  );

  const [logoLoaded, setLogoLoaded] = useState(false);

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        bgcolor: colors.bg,
        color: colors.fg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pt: 1,
      }}
    >
      {/* Wrapper com tamanho fixo para zero layout-shift */}
      <Box
        sx={{
          width,
          height,
          borderRadius: 2,
          overflow: 'hidden',
          mb: 2,
          position: 'relative',
          // shimmer leve enquanto a imagem não pinta (sem Skeleton)
          background:
            'linear-gradient(90deg, rgba(255,255,255,.08) 0%, rgba(255,255,255,.16) 50%, rgba(255,255,255,.08) 100%)',
        }}
      >
        {logoUrl && (
          <Image
            src={logoUrl}
            alt="Logo da campanha"
            fill
            priority
            sizes={`${width}px`}
            onLoadingComplete={() => setLogoLoaded(true)}
            style={{
              objectFit: 'contain',
              opacity: logoLoaded ? 1 : 0,
              transition: 'opacity .2s ease',
            }}
          />
        )}
      </Box>

      {/* Conteúdo central */}
      <Box sx={{ width: '100%', flex: 1, display: 'grid', placeItems: 'center', px: 2 }}>
        {children}
      </Box>

      {/* Raposinha embaixo — deixa lazy para não competir com a logo */}
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
