import 'server-only';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

type ReqBody = {
  codigo: string;
  nome: string;
  telefone: string;
  endereco: string;
};

type RespOk = { ok: true; campanhaId: string; ganhadorId: string };
type RespErr = { ok: false; error: string };

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<ReqBody>;
    const { codigo, nome, telefone, endereco } = body;

    if (!codigo || !nome || !telefone || !endereco) {
      return NextResponse.json<RespErr>(
        { ok: false, error: 'Parâmetros inválidos' },
        { status: 400 }
      );
    }

    const code = codigo.toUpperCase();

    // 1) localiza o código
    const codSnap = await adminDb
      .collection('codigos')
      .where('codigo', '==', code)
      .limit(1)
      .get();

    if (codSnap.empty) {
      return NextResponse.json<RespErr>(
        { ok: false, error: 'Código não encontrado' },
        { status: 200 }
      );
    }

    const codeRef = codSnap.docs[0].ref;
    const codeData = codSnap.docs[0].data() as {
      campanhaId: string;
      status: string;
      premiado?: string | null;
    };

    // 2) só aceita ganhador vindo do fluxo correto
    if (!codeData.premiado || codeData.premiado === 'nenhum') {
      return NextResponse.json<RespErr>(
        { ok: false, error: 'Este código não é premiado' },
        { status: 200 }
      );
    }

    // Estados válidos para salvar dados
    const estadosAceitos = new Set(['aguardando dados ganhador', 'coleta de dados do ganhador']);
    if (!estadosAceitos.has(codeData.status)) {
      return NextResponse.json<RespErr>(
        { ok: false, error: 'Código ainda não está na etapa de coleta de dados' },
        { status: 200 }
      );
    }

    // 3) cria/atualiza registro do ganhador e marca o código
    const batch = adminDb.batch();
    const ganhadorRef = adminDb.collection('ganhadores').doc(); // novo id

    batch.set(ganhadorRef, {
      nome,
      telefone,
      endereco,
      codigoOriginal: code,
      codigoId: codeRef.id,
      campanhaId: codeData.campanhaId,
      criadoEm: Timestamp.now(),
    });

    batch.update(codeRef, {
      status: 'coleta de dados do ganhador',
      ganhadorId: ganhadorRef.id,
      atualizadoEm: Timestamp.now(),
    });

    await batch.commit();

    return NextResponse.json<RespOk>({
      ok: true,
      campanhaId: codeData.campanhaId,
      ganhadorId: ganhadorRef.id,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Falha interna';
    return NextResponse.json<RespErr>({ ok: false, error: msg }, { status: 500 });
  }
}
