// app/[campanha]/ganhador/page.tsx
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import GanhadorClient from './GanhadorClient';

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

async function getPremioByCodigo(codigo: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const res = await fetch(`${base}/api/sorteio/codigo/info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codigo }),
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const json = await res.json(); // { ok: true, premiado: string | null }
  return json?.premiado ?? null;
}

export default async function Page({
  params,
  searchParams,
}: {
  params: { campanha: string };
  searchParams: { codigo?: string };
}) {
  const slug = params.campanha;
  const codigo = (searchParams?.codigo || '').toUpperCase();

  // 1) Tema + campanhaId no servidor (sem flicker)
  const data = await getCampanhaBySlug(slug);
  if (!data) return notFound();
  const { campanhaId, tema } = data;

  // 2) Info do prêmio pelo código (server)
  const premiado = codigo ? await getPremioByCodigo(codigo) : null;

  const bg = tema.backgroundColor ?? '#b30000';
  const fg = tema.textColor ?? '#ffffff';
  const logo = tema.logoUrl ?? undefined;

  return (
    <BaseSorteio logoUrl={logo} backgroundColor={bg} textColor={fg}>
      {/* Client mínimo com o formulário */}
      <GanhadorClient
        slug={slug}
        campanhaId={campanhaId}
        codigoInicial={codigo}
        premiado={premiado ?? undefined}
        textColor={fg}
      />
    </BaseSorteio>
  );
}

