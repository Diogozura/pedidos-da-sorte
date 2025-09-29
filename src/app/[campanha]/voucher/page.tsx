import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import VoucherClient from './VoucherClient';

type CampanhaUI = { logoUrl?: string | null; backgroundColor?: string | null; textColor?: string | null };

const BaseSorteio = dynamic(() => import('@/components/BaseSorteio').then(m => m.BaseSorteio), { ssr: true });

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
  const campanhaId: string | null = json.campanhaId ?? json.campanha?.id ?? null;
  return { campanhaId, tema };
}

async function gerarVoucher(codigo: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const res = await fetch(`${base}/api/sorteio/voucher/gerar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codigo }),
    cache: 'no-store',
  });
  if (!res.ok) return null;

  const json: { ok: boolean; codigoVoucher?: string } = await res.json();
  if (!json.ok || !json.codigoVoucher) return null;

  return json.codigoVoucher;
}

type Params = { campanha: string };
type Search = { codigo?: string; c?: string };

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const { campanha: slug } = await params;           // ✅
  const sp = await searchParams;                      // ✅
  const codigo = (sp.codigo || sp.c || '').toUpperCase();
  if (!codigo) return notFound();

  const camp = await getCampanhaBySlug(slug);
  if (!camp) return notFound();
  const { tema } = camp;
  const bg = tema.backgroundColor ?? '#b30000';
  const fg = tema.textColor ?? '#ffffff';
  const logo = tema.logoUrl ?? undefined;

  const voucherCode = await gerarVoucher(codigo);
  if (!voucherCode) return notFound();
  // busca o nome do prêmio associado a esse código (opcional)
  let premioNome: string | undefined = undefined;
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const infoRes = await fetch(`${base}/api/sorteio/codigo/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo }),
      cache: 'no-store',
    });
    if (infoRes.ok) {
      const infoJson = await infoRes.json();
      if (infoJson?.ok && infoJson?.premiado) premioNome = infoJson.premiado;
    }
  } catch (err) {
    // não bloqueia a geração do voucher — apenas ignora se falhar
    console.warn('Falha ao buscar info do código:', err);
  }

  return (
    <BaseSorteio logoUrl={logo} backgroundColor={bg} textColor={fg}  loadingText="Gerando voucher...">
      <VoucherClient codigo={codigo} voucherCode={voucherCode} textColor={fg} premio={premioNome} />
    </BaseSorteio>
  );
}
