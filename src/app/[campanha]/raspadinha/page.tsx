// app/[campanha]/raspadinha/page.tsx
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import RaspadinhaClient from './RaspadinhaClient';

type CampanhaUI = {
  logoUrl?: string | null;
  backgroundColor?: string | null;
  textColor?: string | null;
};

const BaseSorteio = dynamic(() => import('@/components/BaseSorteio').then(m => m.BaseSorteio), {
  ssr: true,
});

async function getCampanhaBySlug(slug: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const res = await fetch(`${base}/api/sorteio/campanha-info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug }),
    cache: 'no-store',
  });
  if (!res.ok) return null;

  const json = await res.json();
  const tema: CampanhaUI = {
    logoUrl: json.campanha?.logoUrl ?? null,
    backgroundColor: json.campanha?.backgroundColor ?? json.campanha?.corFundo ?? null,
    textColor: json.campanha?.textColor ?? null,
  };
  return { campanhaId: json.campanhaId ?? json.campanha?.id ?? null, tema };
}

async function startRaspadinha(slug: string, codigo?: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const res = await fetch(`${base}/api/sorteio/raspadinha/iniciar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug, codigo }),
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json() as Promise<{
    premiado: string | null;
    imagemPremio?: string | null;
    percentToFinish?: number | null;
    radius?: number | null;
  }>;
}

export default async function Page({
  params,
  searchParams,
}: {
  params: { campanha: string };
  searchParams: { codigo?: string; c?: string };
}) {
  const slug = params.campanha;
  const codigo = (searchParams.codigo || searchParams.c || '').toUpperCase();
  if (!codigo) return notFound();

  // 1) tema no servidor (evita piscada)
  const camp = await getCampanhaBySlug(slug);
  if (!camp) return notFound();
  const { tema } = camp;
  const bg = tema.backgroundColor ?? '#b30000';
  const fg = tema.textColor ?? '#ffffff';
  const logo = tema.logoUrl ?? undefined;

  // 2) dados de início (imagem do prêmio, etc.) no servidor
  const start = await startRaspadinha(slug, codigo);
  if (!start) return notFound();

  return (
    <BaseSorteio
      logoUrl={logo}
      backgroundColor={bg}
      textColor={fg}
      loading={true}
      loadingText="Preparando jogo..."
    >
      <RaspadinhaClient
        slug={slug}
        codigo={codigo}
        backgroundImage={start.imagemPremio ?? '/nao-ganhou.png'}
        percentToFinish={start.percentToFinish ?? 50}
        radius={start.radius ?? 24}
        premiadoMsg={start.premiado ?? undefined}
      />
    </BaseSorteio>
  );
}


