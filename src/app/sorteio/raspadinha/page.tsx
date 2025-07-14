'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import RaspadinhaJogo from '@/components/Raspadinha';
import { toast } from 'react-toastify';
import { Container } from '@mui/material';


export default function RaspadinhaPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const codigo = searchParams.get('codigo');

  const [validado, setValidado] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [ganhou, setGanhou] = useState(false);
  const [finalizado, setFinalizado] = useState(false); // <- novo

  useEffect(() => {
    if (!codigo) {
      router.replace('/sorteio');
      return;
    }

    // Simula verificação
    setTimeout(() => {
      setValidado(true);
      setCarregando(false);
      setGanhou(Math.random() < 0.3);
    }, 1000);
  }, [codigo]);

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

  if (carregando) return <p>Validando código...</p>;
  if (!validado) return <p>Código inválido.</p>;
  return (
    <Container maxWidth="md" style={{ textAlign: 'center', marginTop: '2rem' }}>
      <h2>Raspe para descobrir se ganhou</h2>
      <RaspadinhaJogo
        width={300}
        height={300}
        backgroundImage={ganhou ? '/result.png' : '/brush.png'}
        onComplete={handleComplete}
      >
        RASPE AQUI
      </RaspadinhaJogo>

      {finalizado && !ganhou && (
        <p style={{ textAlign: 'center', marginTop: '1rem', color: '#BA0100' }}>
          Infelizmente você não ganhou desta vez.
        </p>
      )}
    </Container>
  );
}
