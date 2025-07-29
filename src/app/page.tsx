/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Container, Typography } from '@mui/material';

import { BaseSorteio } from '@/components/baseSorteio';
import RaspadinhaJogo from '@/components/Raspadinha';
;


export default function CodigoPage() {



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
        }}
      >
        <Typography variant="h4" component="h1">
          Raspe e descubra
        </Typography>
        <RaspadinhaJogo 
          width={300}
          height={300}
          backgroundImage={'/premio.png'}
          // onComplete={handleComplete}
        />

      </Container>
    </BaseSorteio>
  );
}
