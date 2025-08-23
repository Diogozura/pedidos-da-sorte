import 'server-only';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

type ReqBody = { codigo: string };
type RespOk = { ok: true };
type RespErr = { ok: false; error: string };

export async function POST(req: Request) {
  try {
    const { codigo } = (await req.json()) as Partial<ReqBody>;
    if (!codigo) {
      return NextResponse.json<RespErr>({ ok: false, error: 'Código obrigatório' }, { status: 400 });
    }
   
    const code = codigo.toUpperCase();

    const codSnap = await adminDb.collection('codigos').where('codigo', '==', code).limit(1).get();
    if (codSnap.empty) {
      return NextResponse.json<RespErr>({ ok: false, error: 'Código não encontrado' }, { status: 200 });
    }

    await codSnap.docs[0].ref.update({
      status: 'encerrado',
      atualizadoEm: Timestamp.now(),
    });

    return NextResponse.json<RespOk>({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Falha interna';
    return NextResponse.json<RespErr>({ ok: false, error: msg }, { status: 500 });
  }
}
