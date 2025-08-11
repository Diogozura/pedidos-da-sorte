'use client';

import { darkTheme } from "@/theme/theme";
import { Box, Skeleton } from "@mui/material";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type Props = {
  children: React.ReactNode;
  logoUrl?: string;
  width?: number;
  height?: number;
};

export function BaseSorteio({
  children,
  logoUrl,
  width = 200,
  height = 200,
}: Props) {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);


  useEffect(() => {
    document.body.style.backgroundColor = darkTheme.palette.background.default;
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, []);

  useEffect(() => {
    let isMounted = true;


    if (!logoUrl) {
      setResolvedSrc(null);
      return;
    }

    
    const img = new window.Image();
    img.onload = () => {
      if (isMounted) {
        
        setResolvedSrc(logoUrl);
       
      }
    };
    img.onerror = () => {
      if (isMounted) {
        
        setResolvedSrc(null); // mantém placeholder
       
      }
    };
    img.src = logoUrl;

    // Se demorar mais que 2s, mantém placeholder
    

    return () => {
      isMounted = false;
     
    };
  }, [logoUrl]);

  const topLogoContent = useMemo(() => {
    if (!resolvedSrc) {
      // Placeholder elegante
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
        style={{ display: 'block' }}
      />
    );
  }, [resolvedSrc, width, height]);

  return (
    <>
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
    </>
  );
}
