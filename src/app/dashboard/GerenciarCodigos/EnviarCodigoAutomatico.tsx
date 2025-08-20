'use client';

import {
  Button,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Stack,
} from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useTheme } from '@mui/material/styles';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  query,
  where,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';

type Props = {
  campanhaId: string;
  /** Nome da campanha para derivar tenantId (slug). */
  campanhaNome?: string;
  /** Tenant opcional. Se informado, prevalece. */
  tenantId?: string;
  /** Delay entre envios (ms). Default: 1500ms */
  delayMs?: number;
};

type EnvioResultado = { phone: string; ok: boolean; error?: string };

function slugify(input: string): string {
  return input
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export default function EnviarCodigoAutomatico({
  campanhaId,
  campanhaNome,
  tenantId: tenantIdProp,
  delayMs = 1500,
}: Props) {
  const theme = useTheme();
  const [telefones, setTelefones] = useState<string[]>([]);
  const [resultados, setResultados] = useState<EnvioResultado[]>([]);
  const [loading, setLoading] = useState(false);
  const cancelRef = useRef(false);
  const [derivedTenantId, setDerivedTenantId] = useState<string>('');

  // Resolve tenantId: prop > campanhaNome (slug) > campanhaId (slug)
  useEffect(() => {
    if (tenantIdProp) setDerivedTenantId(tenantIdProp);
    else if (campanhaNome) setDerivedTenantId(slugify(campanhaNome));
    else setDerivedTenantId(slugify(campanhaId));
  }, [tenantIdProp, campanhaNome, campanhaId]);

  const tenantId = useMemo(() => derivedTenantId, [derivedTenantId]);

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = String(event.target?.result ?? '');
      const linhas = text.split('\n').map((l) => l.trim().replace(/\r/g, '')).filter(Boolean);

      // extrai apenas dígitos por linha, aceita 10–11 dígitos
      const numeros = linhas
        .map((l) => l.replace(/\D/g, ''))
        .filter((l) => /^[0-9]{10,11}$/.test(l));

      if (numeros.length === 0) {
        toast.warning('Nenhum telefone válido encontrado no CSV.');
        return;
      }

      setTelefones(numeros);
      setResultados([]);
      toast.info(`Carregados ${numeros.length} números válidos`);
    };
    reader.readAsText(file);
  };

  async function gerarCodigoParaTelefone(phoneDigits: string): Promise<string> {
    // pega uma posição livre
    const posicoesSnap = await getDocs(
      query(collection(db, 'campanhas', campanhaId, 'posicoes'), where('usado', '==', false))
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

  async function enviarWhatsapp(phoneDigits: string, message: string): Promise<void> {
    const res = await fetch('/api/whats/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ tenantId, phone: phoneDigits, message }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail = typeof (data as { error?: string })?.error === 'string'
        ? (data as { error: string }).error
        : JSON.stringify(data);
      throw new Error(detail || 'Falha no envio');
    }
  }

  const cancelar = () => {
    cancelRef.current = true;
  };

  const processarEnvio = async (): Promise<void> => {
    if (!tenantId) {
      toast.error('Tenant não resolvido. Verifique o nome/ID da campanha.');
      return;
    }
    if (telefones.length === 0) {
      toast.warning('Nenhum telefone válido carregado.');
      return;
    }

    setLoading(true);
    cancelRef.current = false;
    const res: EnvioResultado[] = [];

    for (let i = 0; i < telefones.length; i += 1) {
      if (cancelRef.current) break;
      const tel = telefones[i];

      try {
        const codigo = await gerarCodigoParaTelefone(tel);

        // ===== Formato de mensagem + link (como solicitado) =====
        const siteLink = `${window.location.origin}/${campanhaId}/validador?${codigo}`;
        const message =
          `Parabéns! Você ganhou uma ficha para jogar no *Pedidos da Sorte*! 🎉\n\n` +
          `Seu código é *${codigo}*\n` +
          `Acesse: ${siteLink}`;

        await enviarWhatsapp(tel, message);
        res.push({ phone: tel, ok: true });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        res.push({ phone: tel, ok: false, error: msg });
      }

      setResultados([...res]); // atualiza progresso

      if (i < telefones.length - 1) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }

    setLoading(false);

    const ok = res.filter((r) => r.ok).length;
    const fail = res.length - ok;
    if (ok) toast.success(`${ok} enviados com sucesso`);
    if (fail) toast.error(`${fail} falharam`);
  };

  const enviados = resultados.filter((r) => r.ok).length;
  const falhas = resultados.filter((r) => !r.ok).length;
  const progresso = telefones.length ? Math.round((resultados.length / telefones.length) * 100) : 0;

  return (
    <Card
      sx={{
        borderRadius: 2,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        p: 4,
      }}
    >
      <CardContent>
        <Stack spacing={0.5} alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" align="center" fontWeight="bold">
            Envio Automático por CSV
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Tenant: <b>{tenantId || '—'}</b>
          </Typography>
        </Stack>

        <Box display="flex" flexDirection="column" gap={2}>
          <Button variant="outlined" component="label" size="small" sx={{ fontWeight: 'bold', width: 'fit-content' }}>
            Importar CSV
            <input type="file" accept=".csv" hidden onChange={handleCSVUpload} />
          </Button>

          {telefones.length > 0 && !loading && (
            <Button variant="contained" color="primary" size="small" onClick={() => void processarEnvio()}>
              Enviar {telefones.length} números
            </Button>
          )}

          {loading && (
            <Box>
              <LinearProgress variant="determinate" value={progresso} />
              <Box display="flex" justifyContent="space-between" mt={1}>
                <Typography variant="caption">Progresso: {progresso}%</Typography>
                <Button size="small" color="warning" onClick={cancelar}>
                  Cancelar
                </Button>
              </Box>
            </Box>
          )}

          {(enviados > 0 || falhas > 0) && !loading && (
            <Typography variant="body2">
              ✅ Enviados: {enviados} &nbsp; • &nbsp; ⚠️ Falhas: {falhas}
            </Typography>
          )}

          {falhas > 0 && (
            <Box>
              <Typography variant="body2" color="error">
                Erros (primeiros 10):
              </Typography>
              <List dense>
                {resultados
                  .filter((r) => !r.ok)
                  .slice(0, 10)
                  .map((r) => (
                    <ListItem key={r.phone}>
                      <ListItemText primary={`${r.phone} — ${r.error ?? 'erro'}`} />
                    </ListItem>
                  ))}
              </List>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
