import 'server-only';
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

type ReqBody = { codigo: string; campanhaId: string };
export const runtime = 'nodejs';
export async function POST(req: Request) {
  try {
    const { codigo, campanhaId } = (await req.json()) as Partial<ReqBody>;
    if (!codigo || !campanhaId) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
    }
    const code = codigo.toUpperCase();

    // 1) Confirma campanha
    const campRef = adminDb.doc(`campanhas/${campanhaId}`);
    const campSnap = await campRef.get();
    if (!campSnap.exists) return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 });

    // 2) Busca código (server pode fazer query)
    const codSnap = await adminDb
      .collection('codigos')
      .where('campanhaId', '==', campanhaId)
      .where('codigo', '==', code)
      .limit(1).get();

    if (codSnap.empty) {
      return NextResponse.json({ ok: false, motivo: 'Código inválido ❌' }, { status: 200 });
    }

    const codeRef = codSnap.docs[0].ref;
    const codeData = codSnap.docs[0].data() as {
      status: 'ativo' | 'validado' | 'encerrado' | string;
      premiado?: string | null;
      campanhaId: string;
    };

    // 3) Se já não está "ativo", só informa o status
    if (codeData.status !== 'ativo') {
      return NextResponse.json({ ok: true, statusDepois: codeData.status, campanhaId }, { status: 200 });
    }

    // 4) Transação: decrementa contadores + marca código validado
    await adminDb.runTransaction(async (trx) => {
      const c = await trx.get(campRef);
      if (!c.exists) throw new Error('Campanha não encontrada');

      const updates: Record<string, unknown> = {
        raspadinhasRestantes: FieldValue.increment(-1),
      };
      if (codeData.premiado && codeData.premiado !== 'nenhum') {
        updates.premiosRestantes = FieldValue.increment(-1);
      }

      trx.update(campRef, updates);
      trx.update(codeRef, {
        status: 'validado',
        usado: true,
        usadoEm: Timestamp.now(),
      });
    });

    return NextResponse.json({ ok: true, statusDepois: 'validado', campanhaId }, { status: 200 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Falha interna';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
