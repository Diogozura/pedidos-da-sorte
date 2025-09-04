// app/[campanha]/page.tsx
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import CodigoClient from './CodigoClient';


type CampanhaUI = { logoUrl?: string | null; backgroundColor?: string | null; textColor?: string | null };

const BaseSorteio = dynamic(() => import('@/components/BaseSorteio').then(m => m.BaseSorteio), {
  ssr: true,
});

async function getCampanhaBySlug(slug: string) {
  // Se puder, prefira chamar sua camada de dados diretamente aqui (Firestore/SDK).
  // Caso precise usar sua própria API route, use URL ABSOLUTA:
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const res = await fetch(`${base}/api/sorteio/campanha-info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug }),
    // evita páginas com tema desatualizado em edge:
    cache: 'no-store',
    // se quiser forçar usar os cookies do request (auth), use: next: { revalidate: 0 }
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

export default async function Page({
  params,
  searchParams,
}: {
  params: { campanha: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  
  const slug = params.campanha;
 

  // lê “codigo” da query já no servidor
  const codigoInicial =
    (typeof searchParams.codigo === 'string' && searchParams.codigo) ||
    (typeof searchParams.c === 'string' && searchParams.c) ||
    '';
  console.log('slug', slug);
  const data = await getCampanhaBySlug(slug);
  if (!data) return notFound();

  const { campanhaId, tema } = data;

  // fallback de cores sempre definidos (nada de undefined → sem flicker)
  const bg = tema.backgroundColor ?? '#b30000';
  const fg = tema.textColor ?? '#ffffff';
  const logo = tema.logoUrl ?? undefined;

  return (
    <BaseSorteio logoUrl={logo} backgroundColor={bg} textColor={fg}  loadingText="Preparando jogo..." >
      {/* O HTML já chega ao cliente com o tema certo.
          Só o formulário/validação fica client. */}
      <CodigoClient
        codigoInicial={String(codigoInicial).toUpperCase()}
        campanhaId={campanhaId}
        
        slug={slug}
        textColor={fg}
      />
    </BaseSorteio>
  );
}

