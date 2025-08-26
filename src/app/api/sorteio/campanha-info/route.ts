import 'server-only';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type ReqBody = {
  campanhaId?: string;
  slug?: string;
};

type CampanhaDoc = {
  nome?: string | null;
  titulo?: string | null;
  slug?: string | null;
  logoUrl?: string | null;
  backgroundColor?: string | null; // novo
  corFundo?: string | null;        // legado
  textColor?: string | null;
};

export async function POST(req: Request) {
  try {
    // importa dentro do try: se credencial/admin falhar, cai no catch e devolve JSON
    const { adminDb } = await import('@/lib/firebase-admin');

    let body: ReqBody;
    try {
      body = (await req.json()) as ReqBody;
    } catch {
      return NextResponse.json(
        { ok: false, error: 'Body inválido (esperado JSON)' },
        { status: 400 },
      );
    }

    const { campanhaId, slug } = body;
    if (!campanhaId && !slug) {
      return NextResponse.json(
        { ok: false, error: 'Informe campanhaId ou slug' },
        { status: 400 },
      );
    }

    // resolve campanhaId a partir do slug (se necessário)
    let id = campanhaId ?? null;
    if (!id && slug) {
      const q = await adminDb
        .collection('campanhas')
        .where('slug', '==', slug.trim().toLowerCase())
        .limit(1)
        .get();

      if (q.empty) {
        return NextResponse.json(
          { ok: false, error: 'Campanha não encontrada pelo slug' },
          { status: 404 },
        );
      }
      id = q.docs[0].id;
    }

    const snap = await adminDb.collection('campanhas').doc(id as string).get();
    if (!snap.exists) {
      return NextResponse.json(
        { ok: false, error: 'Campanha não encontrada' },
        { status: 404 },
      );
    }

    const data = (snap.data() ?? {}) as CampanhaDoc;

    return NextResponse.json({
      ok: true,
      campanhaId: id,
      campanha: {
        id,
        nome: data.nome ?? data.titulo ?? null,
        slug: data.slug ?? null,
        logoUrl: data.logoUrl ?? null,
        backgroundColor: data.backgroundColor ?? data.corFundo ?? null,
        textColor: data.textColor ?? null,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Falha interna';
    console.error('[campanha-info] erro:', msg);
    // sempre JSON (nunca deixa virar HTML do Next)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
