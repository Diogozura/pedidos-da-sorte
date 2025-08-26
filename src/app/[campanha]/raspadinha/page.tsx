'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Container, Skeleton, Typography } from '@mui/material';
import Link from 'next/link';
import { BaseSorteio } from '@/components/BaseSorteio';
import { useCampaignTheme } from '@/hook/useCampaignTheme';
import dynamic from 'next/dynamic';
const RaspadinhaJogo = dynamic(() => import('@/components/Raspadinha'), {
  ssr: false,
  loading: () => <Skeleton variant="rounded" width={300} height={300} />,
});

type IniciarOk = {
  ok: true;
  campanhaId: string;
  logoUrl?: string | null;
  premiado: string | null;
  imagemPremio?: string | null
};
type IniciarErr = { ok: false; error: string };

const DEFAULT_NAO_GANHOU_IMG = '/nao-ganhou.png';

type FinalizarOk = {
  ok: true;
  campanhaId: string;
  proximoStatus: 'aguardando dados ganhador' | 'encerrado';
};
type FinalizarErr = { ok: false; error: string };

export default function RaspadinhaPage() {
  const router = useRouter();
  const params = useParams<{ campanha: string }>();

  const slug = params?.campanha;                          // <-- agora é o SLUG

  const [campanhaId, setCampanhaId] = useState<string | null>(null); // <-- novo
  const theme = useCampaignTheme(campanhaId ?? '');       // <-- hook com o ID real

  const [codigo, setCodigo] = useState<string | null>(null);
  const [finalizado, setFinalizado] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string>(DEFAULT_NAO_GANHOU_IMG);

  const [premiado, setPremiado] = useState<string | null>(null);
  const [logoCampanha, setLogoCampanha] = useState<string>('');
console.log('premiado', premiado)

  function preloadImage(src: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      // sem crossOrigin aqui!
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  }

  const applyBackgroundFromResult = useCallback(async (isPremiado: boolean, imagemPremio?: string | null) => {
    const candidate =
      isPremiado && imagemPremio && imagemPremio.trim() ? imagemPremio : DEFAULT_NAO_GANHOU_IMG;

    const ok = await preloadImage(candidate);
    setBackgroundImage(ok ? candidate : DEFAULT_NAO_GANHOU_IMG);
  }, []);


  // parser robusto p/ diagnosticar respostas não-JSON
  const parseJsonSafe = async <T,>(res: Response): Promise<T> => {
    const text = await res.text();
    try { return JSON.parse(text) as T; }
    catch { throw new Error(`Resposta inválida (${res.status}): ${text.slice(0, 180)}`); }
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
        const json = await parseJsonSafe<{ campanhaId: string; campanha?: { logoUrl?: string | null } }>(res);
        if (!res.ok) throw new Error((json as { error?: string })?.error ?? 'Falha ao carregar campanha');

        setCampanhaId(json.campanhaId);
        setLogoCampanha(json.campanha?.logoUrl ?? '');
      } catch {
        toast.error('Campanha não encontrada.');
        router.replace('/');
      }
    })();
  }, [slug, router]);

  const iniciarRaspadinha = useCallback(async (code: string) => {
    try {
      const res = await fetch('/api/sorteio/raspadinha/iniciar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: code }),
      });
      const json = await parseJsonSafe<IniciarOk | IniciarErr>(res);

      if (!res.ok || 'ok' in json && json.ok === false) {
        throw new Error(('error' in json && json.error) || 'Falha ao iniciar raspadinha');
      }

      const ok = json as IniciarOk;
      setLogoCampanha(ok.logoUrl ?? '');
      setPremiado(ok.premiado);
      console.log('Iniciar raspadinha:', ok.premiado);
      await applyBackgroundFromResult(Boolean(ok.premiado), ok.imagemPremio);
    } catch (e) {
      toast.error('Erro na validação: ' + (e as Error).message);
      router.replace(`/${slug}/validador`);
    }
  }, [router, applyBackgroundFromResult, slug]);

  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const code = (qs.get('codigo') || '').toUpperCase();
    setCodigo(code);
    if (!code) {
      router.replace(`/${slug}/validador`);
      return;
    }
    iniciarRaspadinha(code.toUpperCase());
  }, [router, iniciarRaspadinha, slug]);

  const handleComplete = async () => {
    if (!codigo) return;
    setFinalizado(true);
    try {
      const res = await fetch('/api/sorteio/raspadinha/finalizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo }),
      });
      const json = await parseJsonSafe<FinalizarOk | FinalizarErr>(res);

      if (!res.ok || 'ok' in json && json.ok === false) {
        throw new Error(('error' in json && json.error) || 'Falha ao finalizar raspadinha');
      }

      const ok = json as FinalizarOk;
      if (ok.proximoStatus === 'aguardando dados ganhador') {
        toast.success(`🎉 Você ganhou! ${premiado}`);
        setTimeout(() => router.replace(`/${slug}/ganhador?codigo=${encodeURIComponent(codigo)}`), 1200); // <-- usa SLUG
      } else {
        toast.error('Infelizmente você não ganhou desta vez.');
        setTimeout(() => router.replace(`https://www.pedidodasorte.com.br/`), 1200);
      }
    } catch (e) {
      toast.error('Erro ao finalizar: ' + (e as Error).message);
    }
  };

  
  return (
    <BaseSorteio logoUrl={logoCampanha} backgroundColor={theme.backgroundColor ?? undefined}
      textColor={theme.textColor ?? undefined} >
      <Container
        maxWidth="md"
        sx={{ textAlign: 'center', mt: 4, height: '60vh', display: 'grid', alignContent: 'center', justifyContent: 'center' }}
      >
        <Typography variant="h5" component={'h1'} >
          Raspe para descobrir se ganhou
        </Typography>

        <RaspadinhaJogo
          key={backgroundImage}
          width={280}
          height={280}
          backgroundImage={backgroundImage}
          onComplete={handleComplete}
        />

        {finalizado && !premiado && (
          <Typography color="#BA0100" mt={2}>
            Infelizmente você não ganhou desta vez. <Link href="/">Voltar ao início</Link>
          </Typography>
        )}
      </Container>
    </BaseSorteio>
  );
}
