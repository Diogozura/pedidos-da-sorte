'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useFormContext } from '@/config/FormContext';
import { Button, Container, TextField, Typography, Box } from '@mui/material';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { BaseSorteio } from '@/components/BaseSorteio';
import { useCampaignTheme } from '@/hook/useCampaignTheme';

type RespOk = { ok: true; campanhaId: string; ganhadorId: string };
type RespErr = { ok: false; error: string };

type InfoOk = { ok: true; premiado: string | null };
type InfoErr = { ok: false; error: string };

export default function GanhadorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams<{ campanha: string }>();
  const slug = params?.campanha;                             // <-- slug
  const [campanhaId, setCampanhaId] = useState<string>('');  // <-- id real
  const theme = useCampaignTheme(campanhaId);                // <-- hook com ID

  const codigo = searchParams.get('codigo') ?? '';
  const { formValues, setFormValues } = useFormContext();
  const [loading, setLoading] = useState(false);
  const values = (formValues['ganhador'] as Record<string, string>) || {};


  const parseJsonSafe = async <T,>(res: Response): Promise<T> => {
    const text = await res.text();
    try { return JSON.parse(text) as T; }
    catch { throw new Error(`Resposta inválida (${res.status}): ${text.slice(0, 180)}`); }
  };


  const [premio, setPremio] = useState<string | null>(null);
  console.log('campanhaId', campanhaId)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/sorteio/codigo/info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: codigo ? JSON.stringify({ codigo }) : undefined, // ou sem body se usar cookie
        });
        const json = await parseJsonSafe<InfoOk | InfoErr>(res);
        if (!res.ok || ('ok' in json && !json.ok)) {
          throw new Error(('error' in json && json.error) || 'Falha ao recuperar prêmio');
        }
        setPremio((json as InfoOk).premiado);
      } catch (e) {
        console.warn(e);
      }
    })();
  }, [codigo]);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const res = await fetch('/api/sorteio/campanha-info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug }),
        });
        const json = await parseJsonSafe<{ campanhaId: string }>(res);
        console.log(json)
        if (!res.ok) throw new Error((json as { error?: string })?.error ?? 'Falha ao carregar campanha');
        setCampanhaId(json.campanhaId);
      } catch {
        // segue sem tema se falhar, mas ideal redirecionar:
        // router.replace('/');
      }
    })();
  }, [slug]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues('ganhador', { [name]: value });
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo) {
      toast.error('Código inválido.');
      return;
    }

    const resInfo = await fetch('/api/sorteio/codigo/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo }),
    });

    if (!resInfo.ok) throw new Error('Erro ao buscar prêmio do código');
    const info = await resInfo.json() as { ok: boolean; premiado?: string | null };

    const premio = info?.premiado ?? null;
    setLoading(true);
    console.log(premio)
    try {
      const res = await fetch('/api/sorteio/ganhador/salvar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo,
          campanhaId,
          nome: values.nome ?? '',
          telefone: values.telefone ?? '',
          premio,
        }),
      });
      const json = await parseJsonSafe<RespOk | RespErr>(res);

      if (!res.ok || 'ok' in json && json.ok === false) {
        throw new Error(('error' in json && json.error) || 'Falha ao salvar dados');
      }


      toast.success('Dados enviados com sucesso!');
      router.push(`/${slug}/voucher?codigo=${encodeURIComponent(codigo)}`); // <-- usa SLUG
    } catch (err) {
      toast.error('Erro ao salvar dados: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseSorteio logoUrl={theme?.logoUrl ?? undefined} backgroundColor={theme.backgroundColor ?? undefined}
      textColor={theme.textColor ?? undefined}>
      <Container maxWidth="md" sx={{ height: '70vh', display: 'grid', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center', padding: 1 }}>
          <Typography variant="h4" component={'h2'} gutterBottom>
            🎉 Parabéns!
          </Typography>
          <Typography variant="body1" component={'p'} gutterBottom>
            Preencha os dados abaixo e receba o sou voucher para resgatar o seu prêmio! <Typography textTransform={'uppercase'} fontWeight={'bold'} > * {premio} * </Typography>
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
            maxWidth: 400,
            mx: 'auto',
            textAlign: 'center',
          }}
        >
          <TextField
            label="Nome completo"
            name="nome"
            fullWidth
            autoComplete="name"
            required
            value={values.nome || ''}
            onChange={handleInputChange}
            sx={{
              input: { color: theme?.textColor ?? "#ffffff" },
              '& .MuiInputLabel-root': { color: theme?.textColor },
              '& .MuiInputLabel-root.Mui-focused': { color: theme?.textColor },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: theme?.textColor },
                '&:hover fieldset': { borderColor: theme?.textColor },
                '&.Mui-focused fieldset': { borderColor: theme?.textColor },
              },
            }}
          />
          <TextField
            label="Telefone"
            name="telefone"
            fullWidth
            autoComplete="tel"
            required
            value={values.telefone || ''}
            onChange={handleInputChange}
            sx={{
              input: { color: theme?.textColor ?? "#ffffff" },
              '& .MuiInputLabel-root': { color: theme?.textColor },
              '& .MuiInputLabel-root.Mui-focused': { color: theme?.textColor },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: theme?.textColor },
                '&:hover fieldset': { borderColor: theme?.textColor },
                '&.Mui-focused fieldset': { borderColor: theme?.textColor },
              },
            }}
          />

          <Button type="submit" color="primary" variant="contained" disabled={loading}>
            {loading ? 'Enviando...' : 'Validar'}
          </Button>
        </Box>
      </Container>
    </BaseSorteio>
  );
}
