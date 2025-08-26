import 'server-only';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

type ReqBody = {
  codigo?: string;
  nome?: string;
  telefone?: string;
};

type RespOk = {
  ok: true;
  proximoStatus: 'voucher gerado';
  premio: string | null;
};

type RespErr = { ok: false; error: string };

export async function POST(req: Request) {
  try {
    // 1) Body JSON seguro
    let body: ReqBody = {};
    try {
      body = (await req.json()) as ReqBody;
    } catch {
      return NextResponse.json<RespErr>(
        { ok: false, error: 'Body inválido: envie JSON' },
        { status: 400 }
      );
    }

    const { codigo, nome, telefone } = body;
    if (!codigo || !nome || !telefone) {
      return NextResponse.json<RespErr>(
        { ok: false, error: 'codigo, nome e telefone são obrigatórios' },
        { status: 400 }
      );
    }

    const code = codigo.toUpperCase();

    // 2) Busca do código
    const snap = await adminDb
      .collection('codigos')
      .where('codigo', '==', code)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json<RespErr>(
        { ok: false, error: 'Código não encontrado' },
        { status: 404 }
      );
    }

    const ref = snap.docs[0].ref;
    const data = snap.docs[0].data() as {
      campanhaId: string;
      status: string;
      premiado?: string | null; // nome ou 'nenhum'
      ganhador?: { nome?: string; telefone?: string } | null;
    };

    const prizeName =
      data.premiado && data.premiado !== 'nenhum' ? data.premiado : null;

    if (!prizeName) {
      return NextResponse.json<RespErr>(
        { ok: false, error: 'Este código não é premiado.' },
        { status: 400 }
      );
    }

    // 3) Idempotência: se já tem ganhador, só confirma
    if (data.ganhador?.telefone) {
      return NextResponse.json<RespOk>({
        ok: true,
        proximoStatus: 'voucher gerado',
        premio: prizeName,
      });
    }

    // 4) Persistência
    await ref.update({
      ganhador: {
        nome,
        telefone,
        premio: prizeName,
        createdAt: FieldValue.serverTimestamp(),
      },
      status: 'voucher gerado',
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 5) Resposta JSON
    return NextResponse.json<RespOk>({
      ok: true,
      proximoStatus: 'voucher gerado',
      premio: prizeName,
    });
  } catch (e) {
    console.error('ganhador/salvar error:', e);
    const msg = e instanceof Error ? e.message : 'Falha interna';
    return NextResponse.json<RespErr>({ ok: false, error: msg }, { status: 500 });
  }
}
