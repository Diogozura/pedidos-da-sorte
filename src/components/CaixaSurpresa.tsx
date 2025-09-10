'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { Box, Typography, keyframes } from '@mui/material';

type Props = {
  width: number;
  height: number;
  premioImagem: string;
  premioNome: string;
  caixaFechada?: string;
  caixaAberta?: string;
  onComplete?: () => void;
  onReady?: () => void;
};

// Animações
const shake = keyframes`
  0% { transform: rotate(0deg); }
  25% { transform: rotate(-5deg); }
  50% { transform: rotate(0deg); }
  75% { transform: rotate(5deg); }
  100% { transform: rotate(0deg); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const bounce = keyframes`
  0% { transform: scale(0); }
  50% { transform: scale(1.1); }
  75% { transform: scale(0.95); }
  100% { transform: scale(1); }
`;

export default function CaixaSurpresa({
  width,
  height,
  premioImagem,
  premioNome,
  caixaFechada = '/caixa-fechada.png',
  caixaAberta = '/caixa-aberta.png',
  onComplete,
  onReady,
}: Props) {
  const [estado, setEstado] = useState<'fechada' | 'abrindo' | 'aberta'>('fechada');
  const [caixasCarregadas, setCaixasCarregadas] = useState(false);
  const [premioCarregado, setPremioCarregado] = useState(false);
  const clickRef = useRef(false);

  useEffect(() => {
    if (caixasCarregadas && !clickRef.current) {
      onReady?.();
    }
  }, [caixasCarregadas, onReady]);

  const handleClick = () => {
    if (estado !== 'fechada' || clickRef.current) return;
    
    clickRef.current = true;
    setEstado('abrindo');
    
    // Temporização da sequência
    setTimeout(() => {
      setEstado('aberta');
      // Espera um pouco após mostrar o prêmio para chamar onComplete
      setTimeout(() => onComplete?.(), 2000);
    }, 1000);
  };

  // Quando ambas imagens estão carregadas
  const handleCaixaCarregada = () => {
    setCaixasCarregadas(true);
  };

  return (
    <Box
      sx={{
        position: 'relative',
        width,
        height,
        margin: 'auto',
        cursor: estado === 'fechada' ? 'pointer' : 'default',
        userSelect: 'none',
      }}
      onClick={handleClick}
    >
      {/* Caixa fechada */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: estado === 'fechada' ? 'block' : 'none',
          animation: estado === 'fechada' && caixasCarregadas ? `${shake} 1.5s ease-in-out infinite` : 'none',
          '&:hover': {
            transform: 'scale(1.05)',
            transition: 'transform 0.3s ease',
          },
        }}
      >
        <Image
          src={caixaFechada}
          alt="Caixa Surpresa"
          fill
          sizes={`${width}px`}
          priority
          onLoadingComplete={handleCaixaCarregada}
        />
      </Box>

      {/* Caixa abrindo (transitória) */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: estado === 'abrindo' ? 'block' : 'none',
        }}
      >
        <Image
          src={caixaAberta}
          alt="Caixa Aberta"
          fill
          sizes={`${width}px`}
        />
      </Box>

      {/* Caixa aberta com prêmio */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: estado === 'aberta' ? 'flex' : 'none',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Fundo com caixa aberta */}
        <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
          <Image
            src={caixaAberta}
            alt="Caixa Aberta"
            fill
            sizes={`${width}px`}
          />
        </Box>

        {/* Prêmio animado */}
        <Box
          sx={{
            position: 'relative',
            width: width * 0.6,
            height: height * 0.5,
            mb: 2,
            zIndex: 2,
            animation: `${bounce} 0.7s ease forwards`,
          }}
        >
          <Image
            src={premioImagem}
            alt={premioNome}
            fill
            sizes={`${Math.round(width * 0.6)}px`}
            onLoadingComplete={() => setPremioCarregado(true)}
            style={{ objectFit: 'contain' }}
          />
        </Box>

        {/* Nome do prêmio */}
        <Typography
          variant="h5"
          fontWeight="bold"
          sx={{
            color: '#FFD700',
            textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
            zIndex: 2,
            animation: `${fadeIn} 0.7s ease forwards`,
            animationDelay: '0.3s',
            opacity: 0,
          }}
        >
          {premioNome}
        </Typography>
      </Box>
    </Box>
  );
}