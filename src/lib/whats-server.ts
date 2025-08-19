/* eslint-disable @typescript-eslint/no-explicit-any */
import 'server-only';


export type GlobalStatus =
  | 'desconhecido'
  | 'iniciando'
  | 'aguardando_qr'
  | 'reconectando'
  | 'deslogado'
  | 'conectado';

export type StatusResponse = { status: GlobalStatus; updatedAt?: string | null };

export type MessageLog = {
  to: string;
  messageId: string | null;
  status?: string;
  error: string | null;
  ts: string;
};

export type TenantLogsResponse = {
  tenantId: string;
  count: number;
  logs: MessageLog[];
};

const BOT = (process.env.BOT_BASE_URL ?? '').replace(/\/+$/, ''); // sem barra no fim
const KEY = process.env.MASTER_API_KEY ?? '';


function assertEnv() {
  if (!BOT || !KEY) {
    throw new Error('BOT_BASE_URL ou MASTER_API_KEY não configurados no Next (.env.local).');
  }
}

async function mintToken(params: { role: 'user'|'admin'; tenantId?: string; expiresIn?: string }): Promise<string> {
  assertEnv();
  try {
    const r = await fetch(`${BOT}/api/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': KEY },
      body: JSON.stringify({ ...params, expiresIn: params.expiresIn ?? '5m' }),
      cache: 'no-store'
    });
    if (!r.ok) throw new Error(`mint ${r.status} ${await r.text()}`);
    const data = (await r.json()) as { token: string };
    return data.token;
  } catch (e: unknown) {
    const cause = (e as any)?.cause?.code ? ` (cause: ${(e as any).cause.code})` : '';
    throw new Error(`Mint token falhou: ${String(e)}${cause}`);
  }
}

export async function botGetStatus() {
  assertEnv();
  try {
    const token = await mintToken({ role: 'admin' });
    const r = await fetch(`${BOT}/api/status-global`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });
    if (!r.ok) throw new Error(`status ${r.status} ${await r.text()}`);
    return (await r.json()) as { status: string; updatedAt?: string|null };
  } catch (e: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cause = (e as any)?.cause?.code ? ` (cause: ${(e as any).cause.code})` : '';
    throw new Error(`Status fetch falhou: ${String(e)}${cause}`);
  }
}

export async function botGetQrImage(): Promise<Response> {
  assertEnv();
  const res = await fetch(`${BOT}/api/qr/image`, { cache: 'no-store' });
  return new Response(res.body, {
    status: res.status,
    headers: {
      'Content-Type': res.headers.get('content-type') ?? 'image/png',
      'Cache-Control': 'no-store',
    },
  });
}

export async function botSend(params: { tenantId: string; phone: string; message: string }): Promise<Response> {
  const token = await mintToken({ role: 'user', tenantId: params.tenantId });
  return fetch(`${BOT}/api/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
    cache: 'no-store',
  });
}

export async function botLogs(tenantId: string): Promise<TenantLogsResponse> {
  const token = await mintToken({ role: 'user', tenantId });
  const res = await fetch(`${BOT}/api/messages/${encodeURIComponent(tenantId)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`logs: ${res.status}`);
  return (await res.json()) as TenantLogsResponse;
}

export async function botReconnect(hard: boolean): Promise<Response> {
  const token = await mintToken({ role: 'admin' });
  return fetch(`${BOT}/api/reconnect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ hard }),
    cache: 'no-store',
  });
}
