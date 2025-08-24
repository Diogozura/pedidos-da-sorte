'use client';

import { BaseSorteio } from '@/components/BaseSorteio';
import { useEffect, useState } from 'react';
import { Box, Container, Typography } from '@mui/material';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { useCampaignTheme } from '@/hook/useCampaignTheme';

type RespGerarOk = { ok: true; campanhaId: string; codigoVoucher: string };
type RespGerarErr = { ok: false; error: string };
type RespEncerrarOk = { ok: true };
type RespEncerrarErr = { ok: false; error: string };

export default function VoucherPage() {
  const searchParams = useSearchParams();
  const codigo = searchParams.get('codigo') ?? '';
  const [voucherCode, setVoucherCode] = useState<string | null>(null);



  const params = useParams<{ campanha: string }>();
  const slug = params?.campanha;                              // <-- slug
  const [campanhaId, setCampanhaId] = useState<string>('');   // <-- id real
  const theme = useCampaignTheme(campanhaId);                 // <-- hook com ID


  const parseJsonSafe = async <T,>(res: Response): Promise<T> => {
    const txt = await res.text();
    try { return JSON.parse(txt) as T; }
    catch { throw new Error(`Resposta inválida (${res.status}): ${txt.slice(0, 200)}`); }
  };

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
        if (!res.ok) {
          const errorMsg = typeof (json as unknown) === 'object' && json && 'error' in json
            ? (json as { error?: string }).error
            : undefined;
          throw new Error(errorMsg ?? 'Falha ao carregar campanha');
        }
        setCampanhaId(json.campanhaId);
      } catch {
        // opcional: router.replace('/');
      }
    })();
  }, [slug]);

  useEffect(() => {
    const gerarOuRecuperar = async () => {
      if (!codigo) return;
      try {
        const res = await fetch('/api/sorteio/voucher/gerar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codigo }),
        });
        const json = await parseJsonSafe<RespGerarOk | RespGerarErr>(res);

        if (!res.ok || ('ok' in json && json.ok === false)) {
          throw new Error(('error' in json && json.error) || 'Falha ao gerar voucher');
        }
        const ok = json as RespGerarOk;
        setVoucherCode(ok.codigoVoucher);

      } catch (e) {
        toast.error('Erro ao gerar/recuperar voucher: ' + (e as Error).message);
      }
    };
    gerarOuRecuperar();
  }, [codigo]);

  const handleCopy = async () => {
    if (!voucherCode) return;
    try {
      await navigator.clipboard.writeText(voucherCode);
      toast.success('Código copiado com sucesso!');
      if (!codigo) return;

      const res = await fetch('/api/sorteio/codigo/encerrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo }),
      });
      const json = await parseJsonSafe<RespEncerrarOk | RespEncerrarErr>(res);
      if (!res.ok || ('ok' in json && json.ok === false)) {
        throw new Error(('error' in json && json.error) || 'Falha ao encerrar');
      }
    } catch (e) {
      console.error(e);
      // toast.error('Erro ao copiar/encerrar: ' + (e as Error).message);
    }
  };

  return (
    <BaseSorteio logoUrl={theme?.logoUrl ?? undefined} backgroundColor={theme.backgroundColor ?? undefined}
      textColor={theme.textColor ?? undefined}>
      <Container maxWidth="md" sx={{ height: '70vh', display: 'grid', alignContent: 'center', textAlign:'center', justifyContent: 'center' }}>
        <Typography variant='h4' component={'h1'}>🎉 Seu voucher foi gerado!</Typography>

        <Typography variant='body1' component={'p'}>Use esse voucher na loja.</Typography>

        {voucherCode ? (
          <Box
            onClick={handleCopy}
            sx={{
              mt: 2,
              p: 2,
              border: '2px dashed #BA0100',
              backgroundColor: '#fff',
              color: '#000',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
            aria-label="Clique para copiar o voucher"
            role="button"
          >
            {voucherCode}
          </Box>
        ) : (
          <Typography>Gerando voucher...</Typography>
        )}
        <Typography variant='body1' component={'p'}>📷 tire print </Typography>
        <Typography variant="body1" mt={2}>
          Voltar para o <Link href="https://www.pedidodasorte.com.br">início</Link>
        </Typography>
      </Container>
    </BaseSorteio>
  );
}
