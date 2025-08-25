import 'server-only';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminDb } from '@/lib/firebase-admin';

type ReqBody = { codigo?: string };

type RespOk = {
  ok: true;
  premiado: string | null; // nome do prêmio OU null
};

type RespErr = { ok: false; error: string };

export async function POST(req: Request) {
  try {
    // 1) tenta pegar do body; se não tiver, tenta cookie (opcional)
    let codigo: string | undefined;
    try {
      const body = (await req.json()) as ReqBody | null;
      codigo = body?.codigo;
    } catch {
      /* body vazio é ok */
    }
    if (!codigo) {
      codigo = (await cookies()).get('ps_codigo')?.value; // se você usar cookie HttpOnly
    }
    if (!codigo) {
      return NextResponse.json<RespErr>({ ok: false, error: 'Código obrigatório' }, { status: 400 });
    }

    // 2) busca o código
    const code = codigo.toUpperCase();
    const codSnap = await adminDb
      .collection('codigos')
      .where('codigo', '==', code)
      .limit(1)
      .get();

    if (codSnap.empty) {
      return NextResponse.json<RespErr>({ ok: false, error: 'Código não encontrado' }, { status: 404 });
    }

    const codeData = codSnap.docs[0].data() as {
      campanhaId: string;
      premiado?: string | null; // 'nome', 'nenhum', null/undefined
    };

    // 3) normaliza: se 'nenhum' ou vazio -> null
    const prizeName: string | null =
      codeData.premiado && codeData.premiado !== 'nenhum' ? codeData.premiado : null;

    // 4) retorna somente o nome
    return NextResponse.json<RespOk>({ ok: true, premiado: prizeName });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Falha interna';
    return NextResponse.json<RespErr>({ ok: false, error: msg }, { status: 500 });
  }
}
