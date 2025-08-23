import 'server-only';
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

type ReqBody = { campanhaId: string };
export const runtime = 'nodejs';
export async function POST(req: Request) {
  try {
    const { campanhaId } = (await req.json()) as Partial<ReqBody>;
    if (!campanhaId) {
      return NextResponse.json({ error: 'campanhaId obrigatório' }, { status: 400 });
    }

    const snap = await adminDb.doc(`campanhas/${campanhaId}`).get();
    if (!snap.exists) return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 });

    const data = snap.data() ?? {};
    return NextResponse.json({
      campanha: {
        logoUrl: data.logoUrl ?? null,
        backgroundColor: data.backgroundColor ?? null,
        textColor: data.textColor ?? null,
        titulo: data.titulo ?? null,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Falha interna';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
