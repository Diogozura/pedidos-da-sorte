// src/app/api/sorteio/ganhador/salvar/route.ts
import 'server-only';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

type ReqBody = {
  campanhaId: string;        // obrigatório
  codigo: string;            // código original (ex.: "EK6BE0") - obrigatório
  nome: string;              // obrigatório
  telefone: string;          // obrigatório
  premio?: string | null;    // opcional (pode vir da api/codigo/info)
  codigoId?: string | null;  // opcional (id do doc em 'codigos' se você tiver)
};

type RespOk = { ok: true; id: string };
type RespErr = { ok: false; error: string };

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ReqBody;

    const { campanhaId, codigo, nome, telefone, premio = null, codigoId = null } = body ?? {};

    if (!campanhaId || !codigo || !nome || !telefone) {
      return NextResponse.json<RespErr>(
        { ok: false, error: 'campanhaId, codigo, nome e telefone são obrigatórios.' },
        { status: 400 }
      );
    }

    // Evitar duplicidade: 1 ganhador por (campanhaId + codigoOriginal)
    const q = await adminDb
      .collection('ganhadores')
      .where('campanhaId', '==', campanhaId)
      .where('codigoOriginal', '==', codigo)
      .limit(1)
      .get();

    if (q.empty) {
      // cria novo (equivalente ao addDoc no Admin SDK)
      const docRef = await adminDb.collection('ganhadores').add({
        campanhaId,
        codigoOriginal: codigo,
        codigoId: codigoId ?? null,
        nome,
        telefone,
        premio,
        criadoEm: FieldValue.serverTimestamp(),
      });

      return NextResponse.json<RespOk>({ ok: true, id: docRef.id });
    } else {
      // já existe: atualiza dados (sem criar outro)
      const docRef = q.docs[0].ref;
      await docRef.update({
        nome,
        telefone,
        premio,
        atualizadoEm: FieldValue.serverTimestamp(),
      });

      return NextResponse.json<RespOk>({ ok: true, id: docRef.id });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Falha interna';
    return NextResponse.json<RespErr>({ ok: false, error: msg }, { status: 500 });
  }
}
