import 'server-only';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

type ReqBody = { codigo: string; campanhaId?: string };
type RespOk = { ok: true; campanhaId: string; codigoVoucher: string };
type RespErr = { ok: false; error: string };

function gerarCodigoVoucher(len = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function POST(req: Request) {
  try {
    const { codigo, campanhaId } = (await req.json()) as Partial<ReqBody>;
    if (!codigo) {
      return NextResponse.json<RespErr>({ ok: false, error: 'Código obrigatório' }, { status: 400 });
    }
    
    const code = codigo.toUpperCase();

    // 1) localizar doc do código
    const codSnap = await adminDb.collection('codigos').where('codigo', '==', code).limit(1).get();
    if (codSnap.empty) {
      return NextResponse.json<RespErr>({ ok: false, error: 'Código não encontrado' }, { status: 200 });
    }
    const codeRef = codSnap.docs[0].ref;
    const codeData = codSnap.docs[0].data() as {
      campanhaId: string;
      status: string;
      premiado?: string | null;
    };
    const campId = campanhaId ?? codeData.campanhaId;

    // 2) se já existe voucher para esse código, retorna
    const vSnap = await adminDb
      .collection('vouchers')
      .where('codigoOriginal', '==', code)
      .limit(1)
      .get();

    if (!vSnap.empty) {
      const v = vSnap.docs[0].data() as { codigoVoucher: string };
      // Marcar status do código como "voucher gerado" (idempotente)
      await codeRef.update({ status: 'voucher gerado' });
      return NextResponse.json<RespOk>({ ok: true, campanhaId: campId, codigoVoucher: v.codigoVoucher });
    }

    // 3) gerar novo voucher (garante unicidade simples)
    let novo = gerarCodigoVoucher();
    // checagem mínima de unicidade (loop curto)
    for (let i = 0; i < 3; i++) {
      const chk = await adminDb.collection('vouchers').where('codigoVoucher', '==', novo).limit(1).get();
      if (chk.empty) break;
      novo = gerarCodigoVoucher();
    }

    await adminDb.collection('vouchers').add({
      codigoVoucher: novo,
      codigoOriginal: code,
      criadoEm: Timestamp.now(),
      usado: false,
      status: 'valido',
      campanhaId: campId,
    });

    // 4) avança o status do código
    await codeRef.update({ status: 'voucher gerado' });

    return NextResponse.json<RespOk>({ ok: true, campanhaId: campId, codigoVoucher: novo });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Falha interna';
    return NextResponse.json<RespErr>({ ok: false, error: msg }, { status: 500 });
  }
}
