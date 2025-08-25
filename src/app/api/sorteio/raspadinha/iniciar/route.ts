import "server-only";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

type ReqBody = { codigo: string };

type RespOk = {
  ok: true;
  campanhaId: string;
  logoUrl?: string | null;
  premiado: string | null; // nome do prêmio ou null
  imagemPremio?: string | null; // deixe null quando não premiado
};

type RespErr = { ok: false; error: string };

export async function POST(req: Request) {
  try {
    const { codigo } = (await req.json()) as Partial<ReqBody>;
    if (!codigo) {
      return NextResponse.json<RespErr>(
        { ok: false, error: "Código obrigatório" },
        { status: 400 }
      );
    }

    const code = codigo.toUpperCase();

    // 1) Localiza o doc do código
    const codSnap = await adminDb
      .collection("codigos")
      .where("codigo", "==", code)
      .limit(1)
      .get();

    if (codSnap.empty) {
      return NextResponse.json<RespErr>(
        { ok: false, error: "Código inválido" },
        { status: 200 }
      );
    }

    const codeRef = codSnap.docs[0].ref;
    const codeData = codSnap.docs[0].data() as {
      campanhaId: string;
      status:
        | "ativo"
        | "validado"
        | "aguardando raspagem"
        | "aguardando dados ganhador"
        | "encerrado"
        | string;
      premiado?: string | null; // nome do prêmio ou 'nenhum'
    };
    console.log("campData", codeData.premiado);
    // 2) Carrega dados da campanha (logo, lista de prêmios)
    const campRef = adminDb.doc(`campanhas/${codeData.campanhaId}`);
    const campSnap = await campRef.get();
    if (!campSnap.exists) {
      return NextResponse.json<RespErr>(
        { ok: false, error: "Campanha não encontrada" },
        { status: 404 }
      );
    }
    const campData = campSnap.data() || {};
    const premios =
      (campData.premios as Array<{ nome: string; imagem: string }>) ?? [];
    const logoUrl: string | null = (campData.logoUrl as string) ?? null;

    // 3) Define “premiado” e imagem do prêmio
    const prizeName: string | null =
      codeData.premiado && codeData.premiado !== "nenhum"
        ? codeData.premiado
        : null;

    const premiado = !!(prizeName && prizeName !== "nenhum");
    const imagemPremio = premiado
      ? premios.find((p) => p.nome === prizeName)?.imagem ?? undefined
      : undefined;

    // 4) Estados aceitos e transição para “aguardando raspagem”
    if (["usado", "encerrado"].includes(codeData.status)) {
      return NextResponse.json<RespErr>(
        { ok: false, error: "Este código já foi utilizado." },
        { status: 200 }
      );
    }

    if (codeData.status === "validado") {
      // promove para aguardando raspagem na primeira visita
      await codeRef.update({ status: "aguardando raspagem" });
    }
    // Se já estava em 'aguardando raspagem', apenas devolvemos os dados (idempotente)

    return NextResponse.json<RespOk>({
      ok: true,
      campanhaId: codeData.campanhaId,
      logoUrl,
      premiado: prizeName,
      imagemPremio,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Falha interna";
    return NextResponse.json<RespErr>(
      { ok: false, error: msg },
      { status: 500 }
    );
  }
}
