'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Container, TextField, Typography, Box } from '@mui/material';
import { toast } from 'react-toastify';

export default function GanhadorClient({
  slug,
  campanhaId,
  codigoInicial,
  premiado,
  textColor = '#ffffff',
}: {
  slug: string;
  campanhaId: string | null;
  codigoInicial?: string;
  premiado?: string;
  textColor?: string;
}) {
  const router = useRouter();
  const [codigo] = useState<string>(codigoInicial ?? '');
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo) {
      toast.error('Código inválido.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/sorteio/ganhador/salvar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo,
          campanhaId,
          nome,
          telefone,
          premio: premiado ?? null,
        }),
      });
      const json = await res.json();
      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || 'Falha ao salvar dados');
      }
      toast.success('Dados enviados com sucesso!');
      router.push(`/${slug}/voucher?codigo=${encodeURIComponent(codigo)}`);
    } catch (err) {
      toast.error('Erro ao salvar dados: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      maxWidth="md"
      sx={{ minHeight: '50vh', display: 'grid', alignItems: 'center', justifyContent: 'center' }}
    >
      <Box sx={{ textAlign: 'center', p: 1 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          🎉 Parabéns!
        </Typography>
        <Typography variant="body1" gutterBottom>
          Preencha os dados para receber seu voucher
          {premiado ? (
            <>
              {' '}
              — <Typography component="span" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                {premiado}
              </Typography>
            </>
          ) : null}
          .
        </Typography>
      </Box>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          width: '100%',
          maxWidth: 420,
          mx: 'auto',
          textAlign: 'center',
        }}
      >
        <TextField
          label="Nome completo"
          name="nome"
          fullWidth
          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
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

        <TextField
          label="Telefone"
          name="telefone"
          fullWidth
          required
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
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

        <Button type="submit" color="primary" variant="contained" disabled={loading}>
          {loading ? 'Enviando...' : 'Receber voucher'}
        </Button>
      </Box>
    </Container>
  );
}
