'use client';


import { useRouter } from 'next/navigation';
import { Container, Skeleton, Typography } from '@mui/material';


import { toast } from 'react-toastify';
import dynamic from 'next/dynamic';
import { useState } from 'react';

const RaspadinhaJogo = dynamic(() => import('@/components/Raspadinha'), {
  ssr: false,
  loading: () => <Skeleton variant="rounded" width={300} height={300} />,
});

const BaseSorteio = dynamic(
  () => import('@/components/BaseSorteio').then(m => m.BaseSorteio),
  {
    ssr: true, // <- mantém render no servidor (evita flash)
    loading: () => (
      <div
        style={{
          minHeight: '100dvh',
          // opcional: cor base enquanto carrega o chunk do componente
          background: '#b30000',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      />
    ),
  }
);

export default function CodigoPage() {
  const router = useRouter();
  const handleComplete = async () => {

    toast.success('🎉 Você ganhou! 10% de desconto');
    setTimeout(() => {
      router.replace('/ganhador');
    }, 3000); //

  };

  const [loading, setLoading] = useState(true);  // controla o overlay

  return (
    <>
      <BaseSorteio logoUrl="/sua-logo.png"  loading={loading} loadingText="Preparando jogo...">
        <Container
          maxWidth="md"
          sx={{
            height: '50vh',
            display: 'grid',
            alignContent: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            mt: 2,
            color: '#fff'
          }}
        >
          <Typography variant="h5" component="h1" gutterBottom mb={4}>
            Raspe e descubra
          </Typography>
          <RaspadinhaJogo
            width={300}
            height={300}
            backgroundImage={'/premio-10.jpeg'}
            onReady={() => setLoading(false)} 
            onComplete={handleComplete}
          />

        </Container>
      </BaseSorteio>
    </>
  );
}
