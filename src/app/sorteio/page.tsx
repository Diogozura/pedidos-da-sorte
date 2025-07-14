'use client';

import { Button, Container, FormControl, TextField, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'react-toastify';

export default function CodigoPage() {
  const [codigo, setCodigo] = useState('');
  const router = useRouter();

  const handleSubmit = async () => {
    const upperCode = codigo.trim().toUpperCase();

    await toast.promise(
      new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          if (upperCode === 'PEDIDO1') {
            resolve();
          } else {
            reject();
          }
        }, 3000); // simula 3s de validação
      }),
      {
        pending: 'Validando código...',
        success: 'Código válido! 🎉',
        error: 'Código inválido ❌',
      }
    ).then(() => {
      router.push(`/sorteio/raspadinha?codigo=${upperCode}`);
    });
  };

  return (
    <Container maxWidth="md" style={{ textAlign: 'center', marginTop: '2rem' }}>
      <Typography variant='h3' component={'h1'}>Digite seu código de sorteio</Typography>
      <FormControl style={{ marginTop: '1rem' }}>
        <TextField value={codigo} label='código' placeholder='Digite o código...' sx={{ mb: 1 }} onChange={(e) => setCodigo(e.target.value.toUpperCase())} />
        <Button color='primary' variant='contained' onClick={handleSubmit}>Validar</Button>
      </FormControl>

    </Container>
  );
}
