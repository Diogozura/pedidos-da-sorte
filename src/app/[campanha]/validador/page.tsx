'use client';
import { BaseSorteio } from '@/components/BaseSorteio';
import { Button, Container, FormControl, TextField, Typography } from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getRedirectUrlByStatus } from '@/utils/redirectByStatus';

type CampanhaUI = { logoUrl?: string | null; corFundo?: string | null; titulo?: string | null };

export default function CodigoPage() {
  const [codigo, setCodigo] = useState<string>('');
  const [campanha, setCampanha] = useState<CampanhaUI | null>(null);

  const router = useRouter();
  const params = useParams<{ campanha: string }>();
  const campanhaId = params?.campanha;

  useEffect(() => {
    const search = window.location.search;
    if (!search.startsWith('?')) {
      toast.error('Código não informado na URL.');
      return;
    }
    const parsed = search.substring(1).toUpperCase();
    setCodigo(parsed);

    // Carregar infos mínimas da campanha via API (server)
    (async () => {
      try {
        const res = await fetch('/api/sorteio/campanha-info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campanhaId }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Falha ao carregar campanha');
        setCampanha(json.campanha as CampanhaUI);
        if (json.campanha?.logoUrl) new Image().src = json.campanha.logoUrl;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'desconhecido';
        toast.error('Erro ao carregar campanha: ' + msg);
      }
    })();
  }, [campanhaId]);

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

      toast.success('Código válido! 🎉');
      const nextStatus = json.statusDepois ?? 'validado';
      const redirect = getRedirectUrlByStatus(nextStatus, upper, json.campanhaId);
      if (redirect) router.push(redirect);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'desconhecido';
      toast.error('Erro ao validar código: ' + msg);
    }
  };

  return (
    <BaseSorteio logoUrl={campanha?.logoUrl ?? undefined}>
      <Container maxWidth="md" sx={{ height: '40vh', display: 'grid', alignContent: 'center', justifyContent: 'center', textAlign: 'center', mt: 6 }}>
        <Typography variant="h4" component="h1">Digite seu código de sorteio</Typography>
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
                input: { color: 'white' },
                '& .MuiInputLabel-root': { color: 'white' },
                '& .MuiInputLabel-root.Mui-focused': { color: 'white' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'white' },
                  '&:hover fieldset': { borderColor: 'white' },
                  '&.Mui-focused fieldset': { borderColor: 'white' },
                },
              }}
            />
            <Button type="submit" color="primary" variant="contained" sx={{ mt: 2 }} disabled={codigo.length < 5}>
              Validar
            </Button>
          </FormControl>
        </form>
      </Container>
    </BaseSorteio>
  );
}
