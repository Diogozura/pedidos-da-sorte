'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  TextField,
  Typography,
  Stack,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  query,
  where,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { formatPhone } from '@/utils/formatPhone';

type Props = {
  campanhaId: string;
  onCodigoGerado?: (codigo: string) => void;
};

type CampanhaDoc = {
  pizzariaId?: string;
  nome?: string;
};

const PHONE_RE = /^\d{10,15}$/;

function onlyDigits(v: string): string {
  return v.replace(/\D/g, '');
}

export default function EnviarCodigoManual({
  campanhaId,
  onCodigoGerado,
}: Props) {
  const theme = useTheme();
  const user = getAuth().currentUser;

  const [telefone, setTelefone] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [tenantId, setTenantId] = useState<string>('');
  const [campanhaNome, setCampanhaNome] = useState<string>('');
  const abortRef = useRef<AbortController | null>(null);

  // 1) Carrega o tenantId REAL da campanha (nada de slug)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'campanhas', campanhaId));
        if (!snap.exists()) {
          toast.error('Campanha não encontrada.');
          return;
        }
        const data = snap.data() as CampanhaDoc;
        if (!data.pizzariaId) {
          toast.error('Campanha sem tenantId configurado.');
          return;
        }
        if (mounted) {
          setTenantId(data.pizzariaId);
          setCampanhaNome(data.nome ?? '');
        }
      } catch {
        toast.error('Falha ao carregar a campanha.');
        // opcional: console.error(e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [campanhaId]);

  // 2) Cancela qualquer fetch pendente ao desmontar
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const validatePhone = (value: string): boolean => {
    const digits = onlyDigits(value);
    return PHONE_RE.test(digits);
  };

  async function enviarWhatsapp(phoneDigits: string, message: string): Promise<void> {
    const res = await fetch('/api/whats/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ tenantId, phone: phoneDigits, message }),
      signal: abortRef.current?.signal ?? undefined,
    });

    // Propaga erro legível do backend
    const data: unknown = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err =
        (typeof data === 'object' && data && 'error' in data && typeof (data as { error: unknown }).error === 'string')
          ? (data as { error: string }).error
          : `Erro ${res.status}`;
      throw new Error(err);
    }
  }

  const gerarCodigo = async (): Promise<void> => {
    const rawPhone = onlyDigits(telefone);

    if (!tenantId) {
      toast.error('Tenant não resolvido para esta campanha.');
      return;
    }
    if (!validatePhone(telefone)) {
      toast.error('Telefone inválido (somente dígitos, 10–15).');
      return;
    }
    if (isSending) return; // evita duplo envio

    setIsSending(true);
    abortRef.current = new AbortController();

    try {
      // pega 1 posição livre
      const posicoesSnap = await getDocs(
        query(collection(db, 'campanhas', campanhaId, 'posicoes'), where('usado', '==', false))
      );
      if (posicoesSnap.empty) {
        toast.warning('Sem posições disponíveis para essa campanha.');
        return;
      }

      const posDoc = posicoesSnap.docs[0];
      const posData = posDoc.data() as { prize?: string };
      const posId = posDoc.id;

      // gera código
      const novoCodigo = Math.random().toString(36).substring(2, 8).toUpperCase();

      // grava o código
      const codigoRef = await addDoc(collection(db, 'codigos'), {
        codigo: novoCodigo,
        campanhaId,
        telefone: rawPhone,
        userId: user?.uid ?? null,
        posicao: posId,
        criadoEm: Timestamp.now(),
        status: 'ativo',
        usado: false,
        premiado: posData?.prize || 'nenhum',
      });

      // marca posição como usada
      await updateDoc(doc(db, 'campanhas', campanhaId, 'posicoes', posId), { usado: true });

      onCodigoGerado?.(codigoRef.id);

      // monta mensagem (mantive o link com campanhaId; ajuste se preferir por tenantId)
      const siteLink = `${window.location.origin}/${campanhaId}/validador?${novoCodigo}`;
      const message =
        `Parabéns! Você ganhou uma ficha para jogar no *Pedidos da Sorte*! 🎉\n\n` +
        `Seu código é *${novoCodigo}*\n` +
        `Acesse: ${siteLink}`;

      // envia via WhatsApp (Next → Sender)
      await enviarWhatsapp(rawPhone, message);

      toast.success(`Código ${novoCodigo} enviado com sucesso!`);
      try {
        await navigator.clipboard.writeText(novoCodigo);
      } catch {/* ignore */}
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
      console.error('[EnviarCodigoManual] erro:', msg);
    } finally {
      setIsSending(false);
      abortRef.current = null;
    }
  };

  return (
    <Card
      sx={{
        borderRadius: 2,
        height: '100%',
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        p: 4,
      }}
    >
      <CardContent>
        <Stack spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" component="h2" fontWeight="bold">
            Envio Manual de Código
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Campanha: <b>{campanhaNome || campanhaId}</b> · Tenant: <b>{tenantId || '—'}</b>
          </Typography>
        </Stack>

        <Grid container spacing={2} alignItems="center">
          <Grid size={{xs:12, md:5}} >
            <TextField
              size="small"
              fullWidth
              placeholder="(11) 99124-9136"
              value={telefone}
              onChange={(e) => setTelefone(formatPhone(e.target.value))}
              inputProps={{ inputMode: 'numeric', pattern: '\\d*', maxLength: 15, style: { textAlign: 'center' } }}
              helperText="Somente dígitos (10–15). Ex.: 11991249136"
            />
          </Grid>

          <Grid size={{xs:12, md:7}}>
            <Button
              size="medium"
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => void gerarCodigo()}
              disabled={isSending}
              startIcon={
                isSending ? <CircularProgress size={18} /> : <FontAwesomeIcon icon={faPaperPlane} />
              }
            >
              {isSending ? 'Enviando…' : 'Gerar e enviar via WhatsApp'}
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
