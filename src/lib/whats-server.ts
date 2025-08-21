'use server';
import 'server-only';

type Role = 'empresa' | 'admin';

export type SendReq = { tenantId: string; phone: string; message: string };
export type SendRes = { success: boolean; messageId?: string; error?: string };

export type BatchStartReq =
  | { tenantId: string; numbers: string[]; message: string; delayMsBetween?: number }
  | { tenantId: string; items: Array<{ number: string; message: string }>; delayMsBetween?: number };

export type BatchInfo = {
  batchId: string;
  tenantId: string;
  status: 'queued' | 'running' | 'done' | 'cancelled' | 'error';
  total: number;
  sent: number;
  failed: number;
  message?: string;
  delayMsBetween?: number;
};

const BASE = (process.env.BOT_BASE_URL ?? 'http://localhost:3001').replace(/\/+$/,'');
const MASTER_KEY = process.env.MASTER_API_KEY ?? process.env.MASTER_API_KEY ?? '';

function reqEnv(name: string, val: string): string {
  if (!val) throw new Error(`Missing env ${name}`);
  return val;
}

function buildUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${BASE}${p}`;
}

function extractTenantFromPath(path: string): string | null {
  // tenta achar o tenant no padrão /api/{tenantId}/...
  const m = path.match(/\/api\/([^/]+)(?:\/|$)/i);
  return m?.[1] ?? null;
}

/** Mint token no Sender para o tenant especificado */
export async function mintToken(tenantId: string, role: Role = 'empresa', expiresIn = '5m'): Promise<string> {
  const apiKey = reqEnv('WHATS_MASTER_API_KEY', MASTER_KEY);
  const res = await fetch(buildUrl('/api/token'), {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenantId, role, expiresIn }),
    cache: 'no-store',
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j?.token) throw new Error(`token_failed ${res.status}: ${JSON.stringify(j)}`);
  return j.token as string;
}

/* ---------------- Back-compat: callSender ---------------- */

/** Retorna o Response bruto (para imagens/streams). */
export async function callSenderRaw(
  path: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
    tenantId?: string;
    role?: Role;
  }
): Promise<Response> {
  const url = buildUrl(path);
  const tenantId = init?.tenantId ?? extractTenantFromPath(path);
  if (!tenantId) throw new Error('callSender: tenantId não encontrado (passe em init.tenantId ou inclua em /api/{tenantId}/...)');

  const bearer = await mintToken(tenantId, init?.role ?? 'empresa');

  const isJson = init?.body !== undefined && !(init?.headers && init.headers['Content-Type']);
  const headers: Record<string, string> = {
    ...(init?.headers ?? {}),
    Authorization: init?.headers?.Authorization ?? `Bearer ${bearer}`,
    ...(isJson ? { 'Content-Type': 'application/json' } : {}),
  };

  const body = isJson ? JSON.stringify(init?.body) : (init?.body as BodyInit | null | undefined);

  return fetch(url, {
    method: init?.method ?? 'GET',
    headers,
    body,
    cache: 'no-store',
  });
}

/** Igual ao antigo callSender: já parseia JSON. */
export async function callSenderJson<T = unknown>(path: string, init?: Parameters<typeof callSenderRaw>[1]): Promise<T> {
  const res = await callSenderRaw(path, init);
  const text = await res.text();
  if (!res.ok) throw new Error(`${path} ${res.status}: ${text}`);
  return (text ? (JSON.parse(text) as T) : ({} as T));
}

/** Alias para compatibilidade com handlers antigos */
export const callSender = callSenderJson;

/* ---------------- Helpers específicos (novos) ---------------- */

export async function sendMessage({ tenantId, phone, message }: SendReq): Promise<SendRes> {
  const bearer = await mintToken(tenantId);
  const res = await fetch(buildUrl('/api/send'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bearer}` },
    body: JSON.stringify({ tenantId, phone, message }),
    cache: 'no-store',
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`/api/send ${res.status}: ${text}`);
  try { return JSON.parse(text) as SendRes; } catch { return { success: true } as SendRes; }
}

export async function startBatch(params: BatchStartReq): Promise<{ batchId: string; queued: number }> {
  const tenantId = 'tenantId' in params ? params.tenantId : undefined;
  if (!tenantId) throw new Error('tenantId obrigatório');
  const bearer = await mintToken(tenantId);
  const res = await fetch(buildUrl('/api/send-multiple-async'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bearer}` },
    body: JSON.stringify(params),
    cache: 'no-store',
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`/api/send-multiple-async ${res.status}: ${JSON.stringify(j)}`);
  return j as { batchId: string; queued: number };
}

export async function cancelBatch(batchId: string, tenantId: string): Promise<{ ok: boolean }> {
  const bearer = await mintToken(tenantId);
  const res = await fetch(buildUrl(`/api/batches/${batchId}/cancel`), {
    method: 'POST',
    headers: { Authorization: `Bearer ${bearer}` },
    cache: 'no-store',
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`/api/batches/${batchId}/cancel ${res.status}: ${JSON.stringify(j)}`);
  return j as { ok: boolean };
}

export async function getBatch(batchId: string, tenantId: string): Promise<BatchInfo> {
  const bearer = await mintToken(tenantId);
  const res = await fetch(buildUrl(`/api/batches/${batchId}`), {
    headers: { Authorization: `Bearer ${bearer}` },
    cache: 'no-store',
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`/api/batches/${batchId} ${res.status}: ${JSON.stringify(j)}`);
  return j as BatchInfo;
}

export async function getBatchItems(
  batchId: string,
  tenantId: string,
  status?: 'queued' | 'sent' | 'failed'
): Promise<{ batchId: string; count: number; items: Array<Record<string, unknown>> }> {
  const bearer = await mintToken(tenantId);
  const url = new URL(buildUrl(`/api/batches/${batchId}/items`));
  if (status) url.searchParams.set('status', status);
  const res = await fetch(url, { headers: { Authorization: `Bearer ${bearer}` }, cache: 'no-store' });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`/api/batches/${batchId}/items ${res.status}: ${JSON.stringify(j)}`);
  return j as { batchId: string; count: number; items: Array<Record<string, unknown>> };
}

/* --------- helpers de sessão, caso queira usar diretamente --------- */

export const getStatus = async (tenantId: string) =>
  callSenderJson<{ tenantId: string; status: string; updatedAt?: string }>(`/api/${tenantId}/status`, { tenantId });

export const getQrText = async (tenantId: string) =>
  callSenderRaw(`/api/${tenantId}/qr`, { tenantId });

export const getQrImage = async (tenantId: string) =>
  callSenderRaw(`/api/${tenantId}/qr/image`, { tenantId });

export const reconnectTenant = async (tenantId: string) =>
  callSenderJson(`/api/${tenantId}/reconnect`, { method: 'POST', tenantId });

export const disconnectTenant = async (tenantId: string) =>
  callSenderJson(`/api/${tenantId}/disconnect`, { method: 'POST', tenantId });
