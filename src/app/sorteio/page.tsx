'use client';

import { Button, Container, FormControl, TextField, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'react-toastify';

export default function CodigoPage() {
  const [codigo, setCodigo] = useState('');
  const router = useRouter();

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault(); // Previni o reload do form
    const upperCode = codigo.trim().toUpperCase();

    if (upperCode.length < 5) {
      toast.warning('O código deve ter pelo menos 5 caracteres.');
      return;
    }

    await toast
      .promise(
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
      )
      .then(() => {
        router.push(`/sorteio/raspadinha?codigo=${upperCode}`);
      });
  };

  return (
    <>
   
     
    <Container maxWidth="md" sx={{ textAlign: 'center', mt: 6 }}>
      <Typography variant="h3" component="h1">
        Digite seu código de sorteio
      </Typography>

      <form onSubmit={handleSubmit}>
        <FormControl fullWidth sx={{ mt: 4 }}>
          <TextField
            value={codigo}
            label="Código"
            placeholder="PEDIDO1"
            required
            inputProps={{ minLength: 5 }}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          />
          <Button
            type="submit"
            color="primary"
            variant="contained"
            sx={{ mt: 2 }}
            disabled={codigo.trim().length < 5}
          >
            Validar
          </Button>
        </FormControl>
      </form>
    </Container>
      
     </>
  );
}
