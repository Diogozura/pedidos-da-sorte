'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import RaspadinhaJogo from '@/components/Raspadinha';
import { toast } from 'react-toastify';
import { Container, Typography } from '@mui/material';
import Link from 'next/link';
import { BaseSorteio } from '@/components/BaseSorteio';
import { useCampaignTheme } from '@/hook/useCampaignTheme';


type IniciarOk = {
  ok: true;
  campanhaId: string;
  logoUrl?: string | null;
  premiado: boolean;
  imagemPremio?: string;
};
type IniciarErr = { ok: false; error: string };

type FinalizarOk = {
  ok: true;
  campanhaId: string;
  proximoStatus: 'aguardando dados ganhador' | 'encerrado';
};
type FinalizarErr = { ok: false; error: string };

export default function RaspadinhaPage() {
  const router = useRouter();
  const params = useParams<{ campanha: string }>();

  const campanhaId = params?.campanha;
  const theme = useCampaignTheme(campanhaId);
  const [codigo, setCodigo] = useState<string | null>(null);
  const [finalizado, setFinalizado] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState('/result.png');

  const [premiado, setPremiado] = useState<boolean>(false);
  const [logoCampanha, setLogoCampanha] = useState<string>('');

  // parser robusto p/ diagnosticar respostas não-JSON
  const parseJsonSafe = async <T,>(res: Response): Promise<T> => {
    const text = await res.text();
    try { return JSON.parse(text) as T; }
    catch { throw new Error(`Resposta inválida (${res.status}): ${text.slice(0, 180)}`); }
  };

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
      setPremiado(Boolean(ok.premiado));
      setBackgroundImage(ok.premiado ? (ok.imagemPremio ?? '/result.png') : '/nao-ganhou.png');
    } catch (e) {
      toast.error('Erro na validação: ' + (e as Error).message);
      router.replace('/sorteio');
    }
  }, [router]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('codigo');
    setCodigo(code);
    if (!code) {
      router.replace('/sorteio');
      return;
    }
    iniciarRaspadinha(code.toUpperCase());
  }, [router, iniciarRaspadinha]);

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
        toast.success('🎉 Você ganhou!');
        setTimeout(() => router.replace(`/${ok.campanhaId}/ganhador?codigo=${codigo}`), 1200);
      } else {
        toast.error('Infelizmente você não ganhou desta vez.');
        setTimeout(() => router.replace(`/`), 1200);
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
        <Typography variant="h4" gutterBottom>
          Raspe para descobrir se ganhou
        </Typography>

        <RaspadinhaJogo
          width={300}
          height={300}
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
