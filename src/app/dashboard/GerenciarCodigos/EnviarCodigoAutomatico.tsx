'use client';

import {
  Button, Card, CardContent, Typography, Box, LinearProgress, Stack,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useTheme } from '@mui/material/styles';
import { db } from '@/lib/firebase';
import {
  collection, doc, getDocs, getDoc, addDoc, query, where, Timestamp, updateDoc, onSnapshot, limit 
} from 'firebase/firestore';

type Props = {
  campanhaId: string;
  delayMs?: number; // delay sugerido entre mensagens no sender
};

type CampanhaDoc = { tenantId?: string; nome?: string };

type BatchDoc = {
  batchId: string;
  tenantId: string;
  status: 'queued' | 'running' | 'done' | 'cancelled' | 'error';
  total: number;
  sent: number;
  failed: number;
  message?: string;
  delayMsBetween?: number;
};

const PHONE_RE = /^\d{10,15}$/;
const onlyDigits = (v: string): string => v.replace(/\D/g, '');

export default function EnviarCodigoAutomatico({ campanhaId, delayMs = 800 }: Props) {
  const theme = useTheme();
  const [tenantId, setTenantId] = useState<string>('');
  const [campanhaNome, setCampanhaNome] = useState<string>('');
  const [telefones, setTelefones] = useState<string[]>([]);
  const [batchId, setBatchId] = useState<string>('');
  const [batch, setBatch] = useState<BatchDoc | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const unsubRef = useRef<() => void>();

  // carrega tenantId REAL da campanha
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'campanhas', campanhaId));
        if (!snap.exists()) { toast.error('Campanha não encontrada.'); return; }
        const data = snap.data() as CampanhaDoc;
        if (!data.tenantId) { toast.error('Campanha sem tenantId.'); return; }
        if (mounted) { setTenantId(data.tenantId); setCampanhaNome(data.nome ?? ''); }
      } catch {
        toast.error('Falha ao carregar campanha.');
      }
    })();
    return () => { mounted = false; };
  }, [campanhaId]);

  // leitura CSV
  async function handleCSVUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const txt = await file.text();
    const numeros = txt.split(/\r?\n/)
      .map(l => onlyDigits(l))
      .filter(n => PHONE_RE.test(n));
    if (!numeros.length) { toast.warning('Nenhum telefone válido no CSV.'); return; }
    setTelefones(numeros);
    toast.info(`Carregados ${numeros.length} números válidos.`);
  }

  // gera 1 código e marca posição como usada
  async function gerarCodigoParaTelefone(phoneDigits: string): Promise<string> {
    const posicoesSnap = await getDocs(
      query(collection(db, 'campanhas', campanhaId, 'posicoes'), where('usado', '==', false), limit(1))
    );
    if (posicoesSnap.empty) throw new Error('Sem posições disponíveis na campanha');

    const posDoc = posicoesSnap.docs[0];
    const posData = posDoc.data() as { prize?: string };
    const posId = posDoc.id;

    const novoCodigo = Math.random().toString(36).substring(2, 8).toUpperCase();

    await addDoc(collection(db, 'codigos'), {
      codigo: novoCodigo,
      campanhaId,
      telefone: phoneDigits,
      userId: null,
      posicao: posId,
      criadoEm: Timestamp.now(),
      status: 'ativo',
      usado: false,
      premiado: posData?.prize || 'nenhum',
    });

    await updateDoc(doc(db, 'campanhas', campanhaId, 'posicoes', posId), { usado: true });

    return novoCodigo;
  }

  // inicia o lote no sender (via rota do Next)
  async function startBatch(items: Array<{ number: string; message: string }>) {
    const res = await fetch('/api/whats/batch/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ tenantId, items, delayMsBetween: delayMs }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = (data && typeof data.error === 'string') ? data.error : `Erro ${res.status}`;
      throw new Error(err);
    }
    return data.batchId as string;
  }

  // observar batch no Firestore
  function subscribeBatch(id: string) {
    unsubRef.current?.();
    const unsub = onSnapshot(doc(db, 'waBatches', id), (snap) => {
      const d = snap.data() as BatchDoc | undefined;
      if (d) setBatch(d);
    });
    unsubRef.current = unsub;
  }

  // cancelar lote
  async function cancelBatch() {
    if (!batchId) return;
    const res = await fetch(`/api/whats/batch/${batchId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      toast.error(j?.error ?? `Erro ${res.status}`);
    }
  }

  // processar: gera códigos + abre o batch
  async function processarEnvio(): Promise<void> {
    if (!tenantId) { toast.error('Tenant não resolvido.'); return; }
    if (!telefones.length) { toast.warning('Nenhum telefone válido carregado.'); return; }

    setLoading(true);
    try {
      // 1) gera mensagens por telefone
      const items: Array<{ number: string; message: string }> = [];
      for (const tel of telefones) {
        try {
          const codigo = await gerarCodigoParaTelefone(tel);
          const link = `${window.location.origin}/${campanhaId}/validador?${codigo}`;
          const message =
            `Parabéns! Você ganhou uma ficha para jogar no *Pedidos da Sorte*! 🎉\n\n` +
            `Seu código é *${codigo}*\n` +
            `Acesse: ${link}`;
          items.push({ number: tel, message });
        } catch (e) {
          // se não tiver posição pra alguém, apenas pula esse número
          toast.error(`Falha ao gerar código para ${tel}: ${(e as Error).message}`);
        }
      }

      if (!items.length) { toast.error('Nenhuma mensagem gerada.'); return; }

      // 2) inicia o lote
      const id = await startBatch(items);
      setBatchId(id);
      subscribeBatch(id);
      toast.success(`Lote iniciado: ${id}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const progresso = batch?.total ? Math.round(((batch.sent + batch.failed) / batch.total) * 100) : 0;

  useEffect(() => () => { unsubRef.current?.(); }, []);

  return (
    <Card sx={{ borderRadius: 2, backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary, p: 4 }}>
      <CardContent>
        <Stack spacing={0.5} alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">Envio Automático por CSV</Typography>
          <Typography variant="caption" color="text.secondary">
            Campanha: <b>{campanhaNome || campanhaId}</b> · Tenant: <b>{tenantId || '—'}</b>
          </Typography>
        </Stack>

        <Box display="flex" flexDirection="column" gap={2}>
          <Button variant="outlined" component="label" size="small" sx={{ fontWeight: 'bold', width: 'fit-content' }}>
            Importar CSV
            <input type="file" accept=".csv" hidden onChange={handleCSVUpload} />
          </Button>

          {telefones.length > 0 && !batchId && !loading && (
            <Button variant="contained" color="primary" size="small" onClick={() => void processarEnvio()}>
              Iniciar envio ({telefones.length} números)
            </Button>
          )}

          {loading && <LinearProgress />}

          {batch && (
            <Box>
              <LinearProgress variant="determinate" value={progresso} />
              <Box display="flex" justifyContent="space-between" mt={1}>
                <Typography variant="caption">
                  Status: {batch.status} — {batch.sent}/{batch.total} enviados, {batch.failed} falhas
                </Typography>
                {batch.status === 'running' && (
                  <Button size="small" color="warning" onClick={() => void cancelBatch()}>
                    Cancelar
                  </Button>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
