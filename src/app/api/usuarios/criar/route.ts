import 'server-only';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

type Nivel = 'empresa' | 'funcionario';

type Body = {
  nome: string;
  email: string;
  senha: string;
  nivel: Nivel;
  pizzariaId?: string; // obrigatório quando admin cria funcionário para uma empresa específica
};

export async function POST(req: NextRequest) {
  try {
    // --- Auth do solicitante ---
    const authHeader = req.headers.get('authorization') ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ ok: false, error: 'Sem token' }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const solicitanteUid = decoded.uid;

    const solicitanteSnap = await adminDb.collection('usuarios').doc(solicitanteUid).get();
    if (!solicitanteSnap.exists) {
      return NextResponse.json({ ok: false, error: 'Solicitante não encontrado' }, { status: 403 });
    }

    const solicitante = solicitanteSnap.data() as {
      uid: string;
      nivel: 'admin' | 'empresa' | 'funcionario';
    };

    if (solicitante.nivel !== 'admin' && solicitante.nivel !== 'empresa') {
      return NextResponse.json({ ok: false, error: 'Permissão negada' }, { status: 403 });
    }

    // --- Body ---
    const body = (await req.json()) as Body;
    const nome = (body.nome ?? '').trim();
    const email = (body.email ?? '').trim().toLowerCase();
    const senha = body.senha ?? '';
    const nivel: Nivel = body.nivel;

    if (!nome || !email || !senha || !nivel) {
      return NextResponse.json({ ok: false, error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    // --- Regras de vínculo da pizzaria/empresa ---
    let pizzariaFinal = '';
    if (nivel === 'funcionario') {
      if (solicitante.nivel === 'empresa') {
        pizzariaFinal = solicitante.uid; // colaborador da própria empresa
      } else {
        // admin criando colaborador para uma empresa específica
        const pizzariaId = body.pizzariaId?.trim();
        if (!pizzariaId) {
          return NextResponse.json({ ok: false, error: 'pizzariaId é obrigatório para colaborador' }, { status: 400 });
        }
        pizzariaFinal = pizzariaId;
      }
    }

    // --- Evitar duplicidade de email (Auth) ---
    try {
      await adminAuth.getUserByEmail(email);
      // se não lançou erro, o usuário já existe
      return NextResponse.json({ ok: false, error: 'Email já cadastrado' }, { status: 400 });
    } catch (e: unknown) {
      // Se for "user-not-found", seguimos; outros erros serão tratados abaixo
      const err = e as { code?: string };
      if (err.code && err.code !== 'auth/user-not-found') {
        // erro inesperado do Admin SDK
        throw e;
      }
    }

    // --- Criar usuário no Auth sem mexer na sessão atual ---
    const userRecord = await adminAuth.createUser({
      email,
      password: senha,
      displayName: nome,
      disabled: false,
    });

    // Se for empresa, ela referencia a si mesma
    const pizzariaIdDoUser = nivel === 'empresa' ? userRecord.uid : pizzariaFinal;

    // --- Montar doc no Firestore ---
    const novoUsuario = {
      uid: userRecord.uid,
      nome,
      email,
      nivel,
      criadoEm: new Date(),
      pizzariaId: pizzariaIdDoUser,
      metodoLogin: 'email' as const,
    };

    await adminDb.collection('usuarios').doc(userRecord.uid).set(novoUsuario);

    return NextResponse.json({ ok: true, uid: userRecord.uid });
  } catch (e: unknown) {
    // Mapear alguns erros comuns do Admin SDK para 400
    const err = e as { code?: string; message?: string };
    if (err.code === 'auth/email-already-exists') {
      return NextResponse.json({ ok: false, error: 'Email já cadastrado' }, { status: 400 });
    }
    if (err.code === 'auth/invalid-password') {
      return NextResponse.json({ ok: false, error: 'Senha inválida (regras do Firebase)' }, { status: 400 });
    }

    console.error(e);
    return NextResponse.json({ ok: false, error: 'Falha ao criar usuário' }, { status: 500 });
  }
}
