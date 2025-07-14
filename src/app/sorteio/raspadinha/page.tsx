'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RaspadinhaJogo from '@/components/Raspadinha';
import { toast } from 'react-toastify';
import { Box, Container } from '@mui/material';
import Link from 'next/link';

export default function RaspadinhaPage() {
  const router = useRouter();
  const [codigo, setCodigo] = useState<string | null>(null);

  const [ganhou, setGanhou] = useState(false);
  const [finalizado, setFinalizado] = useState(false);



  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const codigoURL = searchParams.get('codigo');
    setCodigo(codigoURL);

    if (!codigoURL) {
      router.replace('/sorteio');
      return;
    }

    setTimeout(() => {
    
      setGanhou(Math.random() < 0.3);
    }, 1000);
  }, [router]);

  const handleComplete = () => {
    setFinalizado(true);

    if (ganhou) {
      toast.success('🎉 Você ganhou!');
      setTimeout(() => {
        router.push('/sorteio/ganhador');
      }, 2000);
    } else {
      toast.error('Infelizmente você não ganhou desta vez.');
    }
  };



  return (
    <Container maxWidth="md" style={{ textAlign: 'center', marginTop: '2rem' ,  }}>
      <h2>Raspe para descobrir se ganhou {codigo}</h2>
      <Box sx={{overflow:'hidden'}}>
        <RaspadinhaJogo
          width={300}
          height={300}
          backgroundImage={ganhou ? '/result.png' : '/brush.png'}
          onComplete={handleComplete}
        />
      </Box>



      {finalizado && !ganhou && (
        <p style={{ textAlign: 'center', marginTop: '1rem', color: '#BA0100' }}>
          Infelizmente você não ganhou desta vez. ,  <Link href={'/'}>Voltar ao incio</Link>
        </p>
      )}
    </Container>
  );
}
