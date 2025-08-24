// app/api/sorteio/campanha-info/route.ts
import 'server-only';
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

type ReqBody = {
  campanhaId?: string;
  slug?: string;
};

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { campanhaId, slug } = (await req.json()) as ReqBody;

    // normaliza slug (armazenamos slugs em minúsculas)
    const slugNorm = slug?.toLowerCase().trim();

    if (!campanhaId && !slugNorm) {
      return NextResponse.json({ error: 'campanhaId ou slug obrigatório' }, { status: 400 });
    }

    // 1) Descobre o ID: prioridade para campanhaId; se não vier, resolve por slug
    let id = campanhaId?.trim();

    if (!id && slugNorm) {
      // Fast-path: se você criou o registry /slugs/{slug} na criação
      try {
        const slugDoc = await adminDb.doc(`slugs/${slugNorm}`).get();
        if (slugDoc.exists) {
          id = (slugDoc.data()?.campanhaId as string) ?? undefined;
        }
      } catch {
        // ignora erro do fast-path e tenta fallback
      }

      // Fallback: consulta direta na coleção de campanhas
      if (!id) {
        const qs = await adminDb
          .collection('campanhas')
          .where('slug', '==', slugNorm)
          .limit(1)
          .get();

        if (!qs.empty) id = qs.docs[0].id;
      }

      if (!id) {
        return NextResponse.json({ error: 'Campanha não encontrada (slug)' }, { status: 404 });
      }
    }

    // 2) Carrega a campanha pelo ID
    const snap = await adminDb.doc(`campanhas/${id}`).get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 });
    }

    const data = snap.data() ?? {};

    // 3) Retorno compatível: devolve campanhaId e um objeto "campanha"
    return NextResponse.json({
      campanhaId: id,
      campanha: {
        id,
        // padroniza nome (alguns lugares você chamou de "titulo")
        nome: (data as { nome?: string; titulo?: string }).nome ?? (data as { titulo?: string }).titulo ?? null,
        slug: (data as { slug?: string }).slug ?? slugNorm ?? null,
        logoUrl: (data as { logoUrl?: string | null }).logoUrl ?? null,
        backgroundColor: (data as { backgroundColor?: string | null }).backgroundColor ?? null,
        textColor: (data as { textColor?: string | null }).textColor ?? null,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Falha interna';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
