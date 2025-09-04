'use client';

import { Box, Button, Container, Typography } from '@mui/material';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { useBaseSorteioLoading } from '@/components/BaseSorteio';
import { useEffect, useState } from 'react';

type Props = {
  codigo: string;
  voucherCode: string;
  textColor?: string;
  autoEncerrar?: boolean; // opcional: para encerrar o código sem depender do clique
};

export default function VoucherClient({ codigo, voucherCode, autoEncerrar }: Props) {
  const { setLoading } = useBaseSorteioLoading();
  const [copiando, setCopiando] = useState(false);

  // tira o overlay assim que o client montar
  useEffect(() => {
    setLoading(false);
  }, [setLoading]);

  // (opcional) encerrar automaticamente ao montar
  useEffect(() => {
    if (!autoEncerrar) return;
    void encerrarCodigo(codigo);
  }, [autoEncerrar, codigo]);

  const handleCopy = async () => {
    try {
      setCopiando(true);
      await navigator.clipboard.writeText(voucherCode);
      toast.success('Código copiado com sucesso!');
      await encerrarCodigo(codigo);
    } catch (e) {
      toast.error('Falha ao copiar/encerrar: ' + (e as Error).message);
    } finally {
      setCopiando(false);
    }
  };

  return (
    <Container
      maxWidth="md"
      sx={{
        minHeight: '70vh',
        display: 'grid',
        alignContent: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 2,
      }}
    >
      <Typography variant="h4" component="h1">🎉 Seu voucher foi gerado!</Typography>
      <Typography>Use esse voucher na loja.</Typography>

      <Box
        onClick={handleCopy}
        sx={{
          mt: 1,
          p: 2,
          border: '2px dashed #BA0100',
          backgroundColor: '#fff',
          color: '#000',
          fontWeight: 'bold',
          cursor: 'pointer',
          userSelect: 'all',
          borderRadius: 1,
        }}
        aria-label="Clique para copiar o voucher"
        role="button"
      >
        {voucherCode}
      </Box>

      <Button
        onClick={handleCopy}
        variant="contained"
        color="primary"
        disabled={copiando}
        sx={{ mt: 1, alignSelf: 'center', width: 220 }}
      >
        {copiando ? 'Copiando…' : 'Copiar e encerrar'}
      </Button>

      <Typography>📷 Tire um print</Typography>

      <Typography variant="body1" mt={2}>
        Voltar para o <Link href="https://www.pedidodasorte.com.br">início</Link>
      </Typography>
    </Container>
  );
}

async function encerrarCodigo(codigo: string) {
  const res = await fetch('/api/sorteio/codigo/encerrar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codigo }),
  });
  const json = await res.json();
  if (!res.ok || json?.ok === false) {
    throw new Error(json?.error || 'Falha ao encerrar');
  }
}
