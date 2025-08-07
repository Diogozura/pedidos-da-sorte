'use client';

import { BaseSorteio } from '@/components/BaseSorteio';
import { useRouter } from 'next/navigation';
import { Container, Typography } from '@mui/material';


import { toast } from 'react-toastify';
import dynamic from 'next/dynamic';



const RaspadinhaJogo = dynamic(() => import('@/components/Raspadinha'));

export default function CodigoPage() {
 const router = useRouter();
  const handleComplete = async () => {
  
   toast.success('🎉 Você ganhou! 10% de desconto');
     setTimeout(() => {
            router.replace('/ganhador');
          }, 6000); //
  
  };

  return (
    <BaseSorteio>
      <Container
        maxWidth="md"
        sx={{
          height: '50vh',
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
          backgroundImage={'/premio-10.jpeg'}
          onComplete={handleComplete}
        />

      </Container>
    </BaseSorteio>
  );
}
