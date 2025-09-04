// app/(server)/campanhaTheme.ts
export type CampanhaUI = {
  logoUrl?: string | null;
  backgroundColor?: string | null;
  textColor?: string | null;
};

export async function getCampanhaBySlug(slug: string) {
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
