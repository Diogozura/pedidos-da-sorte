'use client';

import { Box, Skeleton } from "@mui/material";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

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
  backgroundColor = "#b30000", // fallback vermelho
  textColor = "#ffffff",       // fallback branco
}: Props) {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);

  // Aplica cor de fundo dinamicamente
  useEffect(() => {
    const originalBg = document.body.style.backgroundColor;
    const originalColor = document.body.style.color;
    document.body.style.backgroundColor = backgroundColor;
    document.body.style.color = textColor;

    return () => {
      document.body.style.backgroundColor = originalBg;
      document.body.style.color = originalColor;
    };
  }, [backgroundColor, textColor]);

  // Pré-carrega logo
  useEffect(() => {
      localStorage.setItem('colors', backgroundColor + ',' + textColor);
    let isMounted = true;
    if (!logoUrl) {
      setResolvedSrc(null);
      return;
    }
    const img = new window.Image();
    img.onload = () => { if (isMounted) setResolvedSrc(logoUrl); };
    img.onerror = () => { if (isMounted) setResolvedSrc(null); };
    img.src = logoUrl;
    return () => { isMounted = false; };
  }, [logoUrl]);

  const topLogoContent = useMemo(() => {
    if (!resolvedSrc) {
      return (
        <Skeleton
          variant="rounded"
          width={width}
          height={height}
          animation="wave"
        />
      );
    }
    return (
      <Image
        src={resolvedSrc}
        alt="Logo da campanha"
        width={width}
        height={height}
        priority
        fetchPriority="high"
        style={{ display: "block" }}
      />
    );
  }, [resolvedSrc, width, height]);

  return (
    <Box sx={{ color: textColor }}>
      <Box display="flex" justifyContent="center" alignItems="center" mt={1}>
        {topLogoContent}
      </Box>

      {children}

      <Box textAlign="center" mt={4}>
        <Image
          width={150}
          height={78}
          src={'/logo-site.png'}
          alt="Logo do site Pedidos da Sorte"
          loading="lazy"
        />
      </Box>
    </Box>
  );
}
