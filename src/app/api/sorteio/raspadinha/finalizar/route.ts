import 'server-only';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

type ReqBody = { codigo: string };

type RespOk = {
  ok: true;
  campanhaId: string;
  proximoStatus: 'aguardando dados ganhador' | 'encerrado';
};

type RespErr = { ok: false; error: string };

export async function POST(req: Request) {
  try {
    const { codigo } = (await req.json()) as Partial<ReqBody>;
    if (!codigo) {
      return NextResponse.json<RespErr>({ ok: false, error: 'Código obrigatório' }, { status: 400 });
    }

    
    const code = codigo.toUpperCase();

    // 1) Localiza o doc do código
    const codSnap = await adminDb
      .collection('codigos')
      .where('codigo', '==', code)
      .limit(1)
      .get();

    if (codSnap.empty) {
      return NextResponse.json<RespErr>({ ok: false, error: 'Código inválido' }, { status: 200 });
    }

    const codeRef = codSnap.docs[0].ref;
    const data = codSnap.docs[0].data() as {
      campanhaId: string;
      status: string;
      premiado?: string | null;
    };

    if (data.status !== 'aguardando raspagem') {
      // não permite finalizar fora desse estado (idempotência: se já finalizou, devolve o próximo)
      const proximoStatus: 'aguardando dados ganhador' | 'encerrado' =
        data.premiado && data.premiado !== 'nenhum' ? 'aguardando dados ganhador' : 'encerrado';
      return NextResponse.json<RespOk>({ ok: true, campanhaId: data.campanhaId, proximoStatus });
    }

    // 2) Finaliza conforme premiado
    const ganhou = !!(data.premiado && data.premiado !== 'nenhum');
    const proximoStatus: 'aguardando dados ganhador' | 'encerrado' = ganhou
      ? 'aguardando dados ganhador'
      : 'encerrado';

    await codeRef.update({
      status: proximoStatus,
      usado: true,
      usadoEm: Timestamp.now(),
    });

    return NextResponse.json<RespOk>({
      ok: true,
      campanhaId: data.campanhaId,
      proximoStatus,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Falha interna';
    return NextResponse.json<RespErr>({ ok: false, error: msg }, { status: 500 });
  }
}
