'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Container, FormControl, TextField, Typography } from '@mui/material';
import { toast } from 'react-toastify';
import { getRedirectUrlByStatus } from '@/utils/redirectByStatus';

export default function CodigoClient({
  codigoInicial,
  campanhaId,
  slug,
  textColor = '#ffffff',
}: {
  codigoInicial?: string;
  campanhaId: string | null;
  slug: string;
  textColor?: string;
}) {
  const router = useRouter();

  const [codigo, setCodigo] = useState<string>(codigoInicial ?? '');

  useEffect(() => {
    if (codigoInicial) return; // já veio do server
    if (typeof window === 'undefined') return;
    const qs = window.location.search;
    if (qs.startsWith('?') && !qs.includes('=')) {
      setCodigo(qs.substring(1).toUpperCase());
    }
  }, [codigoInicial]);


  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const upper = codigo.trim().toUpperCase();
    if (upper.length < 5) {
      toast.warning('O código deve ter pelo menos 5 caracteres.');
      return;
    }
    try {
      const res = await fetch('/api/sorteio/validar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: upper, campanhaId }),
      });
      const json = await res.json();

      if (!res.ok || json.ok === false) {
        toast.error(json.motivo ?? json.error ?? 'Código inválido ❌');
       
        return;
      }
      
      
      const nextStatus = json.statusDepois ?? 'validado';

      if(nextStatus != 'encerrado') {toast.success('Código válido! 🎉');}
      
      const redirect = getRedirectUrlByStatus(nextStatus, upper, slug);
      if (redirect) router.push(redirect);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'desconhecido';
      toast.error('Erro ao validar código: ' + msg);
    }
  };

  return (
    <Container
      maxWidth="md"
      sx={{
        height: '40vh',
        display: 'grid',
        alignContent: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        mt: 6,
      }}
    >
      <Typography variant="h4" component="h1">
        Digite seu código de sorteio
      </Typography>

      <form onSubmit={handleSubmit}>
        <FormControl fullWidth sx={{ mt: 4 }}>
          <TextField
            value={codigo}
            label="Código"
            placeholder="EX: ABC123"
            required
            inputProps={{ minLength: 5 }}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            sx={{
              input: { color: textColor },
              '& .MuiInputLabel-root': { color: textColor },
              '& .MuiInputLabel-root.Mui-focused': { color: textColor },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: textColor },
                '&:hover fieldset': { borderColor: textColor },
                '&.Mui-focused fieldset': { borderColor: textColor },
              },
            }}
          />
          <Button type="submit" color="primary" variant="contained" sx={{ mt: 2 }}>
            Validar
          </Button>
        </FormControl>
      </form>
    </Container>
  );
}
