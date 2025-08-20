// src/lib/whats-server.ts
export type Status = 'iniciando' | 'aguardando_qr' | 'conectando' | 'conectado' | 'desconectado' | 'erro';

export type StatusResponse = {
  status: Status;
  updatedAt?: string;
  phone?: string | null;
};

export type MessageLog = {
  to: string;
  messageId?: string | null;
  status: 'sent' | 'failed' | 'delivered' | 'read';
  error?: string | null;
  ts: string; // ISO
};

export type TenantLogsResponse = {
  tenantId: string;
  count: number;
  logs: MessageLog[];
};

const BOT = (process.env.BOT_BASE_URL ?? '').replace(/\/$/, '');
const KEY = process.env.MASTER_API_KEY ?? '';
const OR_TENANT = process.env.OR_TENANT_ID ?? 'system';

function assertEnv() {
  if (!BOT) throw new Error('BOT_BASE_URL não configurado no Next (.env.local).');
}

type Cached = { token: string; exp: number };
const cache = new Map<string, Cached>();

function decodeExp(jwt: string): number | null {
  try {
    const [, payload] = jwt.split('.');
    const json = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return typeof json.exp === 'number' ? json.exp : null;
  } catch {
    return null;
  }
}

async function mintToken(tenantId: string, expiresIn = '10m'): Promise<string> {
  assertEnv();
  const url = `${BOT}/token`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(KEY ? { 'x-api-key': KEY } : {}),
    },
    body: JSON.stringify({ tenantId, role: 'empresa', expiresIn }),
    cache: 'no-store',
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`mintToken ${res.status}: ${err}`);
  }
  const data: { token: string } = await res.json();
  const exp = decodeExp(data.token) ?? Math.floor(Date.now() / 1000) + 8 * 60; // fallback 8min
  cache.set(tenantId, { token: data.token, exp });
  return data.token;
}

async function getBearer(tenantId: string): Promise<string> {
  const c = cache.get(tenantId);
  const now = Math.floor(Date.now() / 1000);
  if (!c || c.exp <= now + 30) {
    return mintToken(tenantId);
  }
  return c.token;
}

async function callSender<T = unknown>(
  tenantId: string,
  path: string,
  init?: RequestInit & { raw?: boolean }
): Promise<T | Response> {
  assertEnv();
  const token = await getBearer(tenantId);
  const url = `${BOT}/${tenantId}/${path.replace(/^\/+/, '')}`;
  const headers = new Headers(init?.headers);
  headers.set('authorization', `Bearer ${token}`);
  const res = await fetch(url, { ...init, headers, cache: 'no-store' });
  if (init?.raw) return res;
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${path} ${res.status}: ${err}`);
  }
  return (await res.json()) as T;
}

/** --- Funções usadas pelas suas rotas --- */

export async function getStatus(tenantId?: string): Promise<StatusResponse> {
  const t = tenantId || OR_TENANT;
  return (await callSender(t, 'status', { method: 'GET' })) as StatusResponse;
}

export async function getQrText(tenantId?: string): Promise<{ qr: string; tenantId: string }> {
  const t = tenantId || OR_TENANT;
  return (await callSender(t, 'qr', { method: 'GET' })) as { qr: string; tenantId: string };
}

export async function getQrImage(tenantId?: string): Promise<Response> {
  const t = tenantId || OR_TENANT;
  // retorna a Response para repassar o stream/binário
  return (await callSender(t, 'qr/image', { method: 'GET', raw: true })) as Response;
}

export async function reconnect(tenantId?: string, hard = false): Promise<{ ok: boolean }> {
  const t = tenantId || OR_TENANT;
  return (await callSender(t, `reconnect?hard=${hard ? 1 : 0}`, { method: 'POST' })) as { ok: boolean };
}

export async function disconnect(tenantId?: string, hard = false): Promise<{ ok: boolean }> {
  const t = tenantId || OR_TENANT;
  return (await callSender(t, `disconnect?hard=${hard ? 1 : 0}`, { method: 'DELETE' })) as { ok: boolean };
}

export async function sendMessage(
  tenantId: string,
  to: string,
  message: string
): Promise<{ ok: boolean; messageId?: string }> {
  return (await callSender(tenantId, 'send', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ to, message }),
  })) as { ok: boolean; messageId?: string };
}
