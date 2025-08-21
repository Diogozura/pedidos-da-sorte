import { NextRequest, NextResponse } from 'next/server';
import { sendMessage } from '@/lib/whats-server';

export async function POST(req: NextRequest) {
  try {
    const { tenantId, phone, to, message } = (await req.json()) as {
      tenantId?: string; phone?: string; to?: string; message?: string;
    };
    const digits = String(phone ?? to ?? '').replace(/\D/g, '');
    if (!tenantId) return NextResponse.json({ error: 'tenantId obrigatório' }, { status: 400 });
    if (!/^\d{10,15}$/.test(digits)) return NextResponse.json({ error: 'Telefone inválido (10–15)' }, { status: 400 });
    if (!message?.trim()) return NextResponse.json({ error: 'message obrigatória' }, { status: 400 });

    const r = await sendMessage({ tenantId, phone: digits, message: message.trim() });
    return NextResponse.json(r);
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message) }, { status: 500 });
  }
}
