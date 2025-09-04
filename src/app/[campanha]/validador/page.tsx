import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import CodigoClient from './CodigoClient';

type CampanhaUI = { logoUrl?: string | null; backgroundColor?: string | null; textColor?: string | null };

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

  const campanhaId: string | null = json.campanhaId ?? json.campanha?.id ?? null;
  const tema: CampanhaUI = {
    logoUrl: json.campanha?.logoUrl ?? null,
    backgroundColor: json.campanha?.backgroundColor ?? json.campanha?.corFundo ?? null,
    textColor: json.campanha?.textColor ?? null,
  };

  return { campanhaId, tema };
}

type Params = { campanha: string };
type Search = { codigo?: string | string[]; c?: string | string[] };

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const { campanha: slug } = await params;    // ✅
  const sp = await searchParams;              // ✅

  const codigoInicial =
    (typeof sp.codigo === 'string' && sp.codigo) ||
    (typeof sp.c === 'string' && sp.c) ||
    '';

  const data = await getCampanhaBySlug(slug);
  if (!data) return notFound();

  const { campanhaId, tema } = data;

  const bg = tema.backgroundColor ?? '#b30000';
  const fg = tema.textColor ?? '#ffffff';
  const logo = tema.logoUrl ?? undefined;

  return (
    <BaseSorteio logoUrl={logo} backgroundColor={bg} textColor={fg} loadingText="Preparando jogo...">
      <CodigoClient
        codigoInicial={String(codigoInicial).toUpperCase()}
        campanhaId={campanhaId}
        slug={slug}
        textColor={fg}
      />
    </BaseSorteio>
  );
}
