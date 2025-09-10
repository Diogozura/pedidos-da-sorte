'use client';

import dynamic from 'next/dynamic';
import { Container, Skeleton, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { useEffect } from 'react';
import { useBaseSorteioLoading } from '@/components/BaseSorteio';

const CaixaSurpresa = dynamic(() => import('@/components/CaixaSurpresa'), {
  ssr: false,
  loading: () => <Skeleton variant="rounded" width={300} height={300} />,
});

type Props = {
  slug: string;
  codigo: string;
  premioImagem: string;
  premioNome: string;
  caixaFechada?: string;
  caixaAberta?: string;
};

export default function CaixaSurpresaClient(props: Props) {
  const router = useRouter();
  const { setLoading } = useBaseSorteioLoading();

  // desligar loading ao montar
  useEffect(() => {
    requestAnimationFrame(() => setLoading(false));
  }, [setLoading]);

  const onComplete = async () => {
    try {
      const res = await fetch('/api/sorteio/caixa-surpresa/finalizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: props.codigo }),
      });
      const json = await res.json();

      if (!res.ok || json?.ok === false) throw new Error(json?.error || 'Falha ao finalizar');

      if (json.proximoStatus === 'aguardando dados ganhador') {
        toast.success(`🎉 Você ganhou: ${props.premioNome}!`);
        setTimeout(() => router.replace(`/${props.slug}/ganhador?codigo=${encodeURIComponent(props.codigo)}`), 1200);
      } else {
        toast.error('Infelizmente você não ganhou desta vez.');
        setTimeout(() => router.replace('https://www.pedidodasorte.com.br/'), 1200);
      }
    } catch (e) {
      toast.error('Erro ao finalizar: ' + (e as Error).message);
    }
  };

  return (
    <Container maxWidth="md" sx={{ textAlign: 'center', mt: 1, minHeight: '50vh', display: 'grid', placeContent: 'center', color: '#fff' }}>
      <Typography variant="h5" component="h1" sx={{ mb: 2 }}>
        Clique na caixa para abrir
      </Typography>

      <CaixaSurpresa
        width={300}
        height={300}
        premioImagem={props.premioImagem}
        premioNome={props.premioNome}
        caixaFechada={props.caixaFechada || '/caixa-fechada.png'}
        caixaAberta={props.caixaAberta || '/caixa-aberta.png'}
        onReady={() => setLoading(false)}
        onComplete={onComplete}
      />
    </Container>
  );
}