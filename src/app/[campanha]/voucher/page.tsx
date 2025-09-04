// app/[campanha]/voucher/page.tsx
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

  // 1) tema no servidor (sem flicker)
  const camp = await getCampanhaBySlug(slug);
  if (!camp) return notFound();
  const { tema } = camp;
  const bg = tema.backgroundColor ?? '#b30000';
  const fg = tema.textColor ?? '#ffffff';
  const logo = tema.logoUrl ?? undefined;

  // 2) gera/recupera voucher no servidor
  const voucherCode = await gerarVoucher(codigo);
  if (!voucherCode) return notFound();

  return (
    <BaseSorteio
      logoUrl={logo}
      backgroundColor={bg}
      textColor={fg}
      loading={true}
      loadingText="Gerando voucher..."
    >
      <VoucherClient
        codigo={codigo}
        voucherCode={voucherCode}
        textColor={fg}
        // se quiser encerrar automaticamente em vez de só ao copiar:
        // autoEncerrar
      />
    </BaseSorteio>
  );
}


