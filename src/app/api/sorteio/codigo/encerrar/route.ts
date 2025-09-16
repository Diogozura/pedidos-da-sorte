import 'server-only';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

/*
  Encerra um código manualmente (ex: após copiar voucher).
  Regras:
    - Código deve existir
    - Se já estiver em 'encerrado' ou 'voucher gerado' retorna ok idempotente
*/

type ReqBody = { codigo?: string };
type RespOk = { ok: true; statusAnterior: string; statusFinal: string };
type RespErr = { ok: false; error: string };

export async function POST(req: Request) {
  try {
    let body: ReqBody;
    try { body = (await req.json()) as ReqBody; } catch { body = {}; }
    const codigo = body.codigo?.toUpperCase();
    if (!codigo) {
      return NextResponse.json<RespErr>({ ok: false, error: 'Código obrigatório' }, { status: 400 });
    }

    const snap = await adminDb.collection('codigos').where('codigo', '==', codigo).limit(1).get();
    if (snap.empty) {
      return NextResponse.json<RespErr>({ ok: false, error: 'Código não encontrado' }, { status: 200 });
    }

    const ref = snap.docs[0].ref;
    const data = snap.docs[0].data() as { status?: string };
    const statusAnterior = data.status || 'desconhecido';

    if (['encerrado'].includes(statusAnterior)) {
      return NextResponse.json<RespOk>({ ok: true, statusAnterior, statusFinal: statusAnterior });
    }

    await ref.update({ status: 'encerrado', encerradoEm: Timestamp.now() });

    return NextResponse.json<RespOk>({ ok: true, statusAnterior, statusFinal: 'encerrado' });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Falha interna';
    return NextResponse.json<RespErr>({ ok: false, error: msg }, { status: 500 });
  }
}
