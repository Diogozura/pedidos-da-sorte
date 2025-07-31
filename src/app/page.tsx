'use client';


import { useRouter } from 'next/navigation';
import { Container, Typography } from '@mui/material';

import { BaseSorteio } from '@/components/baseSorteio';
import RaspadinhaJogo from '@/components/Raspadinha';
import { toast } from 'react-toastify';
;


export default function CodigoPage() {
 const router = useRouter();
  const handleComplete = async () => {
  
   toast.success('🎉 Você ganhou! 10% de desconto');
  router.replace('/ganhador');
  };

  return (
    <BaseSorteio>
      <Container
        maxWidth="md"
        sx={{
          height: '70vh',
          display: 'grid',
          alignContent: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          mt: 6,
          color: '#fff'
        }}
      >
        <Typography variant="h4" component="h1">
          Raspe e descubra
        </Typography>
        <RaspadinhaJogo
          width={300}
          height={300}
          backgroundImage={'/premio.png'}
          onComplete={handleComplete}
        />

      </Container>
    </BaseSorteio>
  );
}
