'use client';

import dynamic from 'next/dynamic';
import { Container, Skeleton, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { useEffect } from 'react';
import { useBaseSorteioLoading } from '@/components/BaseSorteio';

const Raspadinha = dynamic(() => import('@/components/Raspadinha'), {
  ssr: false,
  loading: () => <Skeleton variant="rounded" width={300} height={300} />,
});

type Props = {
  slug: string;
  codigo: string;
  backgroundImage: string;
  percentToFinish: number;
  radius: number;
  premiadoMsg?: string;
};

export default function RaspadinhaClient(props: Props) {
  const router = useRouter();
  const { setLoading } = useBaseSorteioLoading();

  // desligar logo ao montar (garante que o overlay some mesmo se o chunk do canvas já baixou)
  useEffect(() => {
    // dar 1 frame ajuda a evitar “piscar” em alguns dispositivos
    requestAnimationFrame(() => setLoading(false));
  }, [setLoading]);

  const onComplete = async () => {
    try {
      const res = await fetch('/api/sorteio/raspadinha/finalizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: props.codigo }),
      });
      const json = await res.json();

      if (!res.ok || json?.ok === false) throw new Error(json?.error || 'Falha ao finalizar');

      if (json.proximoStatus === 'aguardando dados ganhador') {
        toast.success(`🎉 Você ganhou! ${props.premiadoMsg ?? ''}`.trim());
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
    <Container maxWidth="md" sx={{ textAlign: 'center', mt: 4, minHeight: '60vh', display: 'grid', placeContent: 'center', color: '#fff' }}>
      <Typography variant="h5" component="h1" sx={{ mb: 2 }}>
        Raspe para descobrir se ganhou
      </Typography>

      <Raspadinha
        width={300}
        height={300}
        backgroundImage={props.backgroundImage}
        percentToFinish={props.percentToFinish}
        radius={props.radius}
        // se preferir, desliga o overlay só quando o jogo sinalizar que está pronto:
        // onReady={() => setLoading(false)}
        onComplete={onComplete}
      />
    </Container>
  );
}
