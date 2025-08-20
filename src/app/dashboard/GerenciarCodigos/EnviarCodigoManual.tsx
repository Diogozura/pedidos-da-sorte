'use client';

import {
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Stack,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
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
import { getAuth } from 'firebase/auth';
import { formatPhone } from '@/utils/formatPhone';

type Props = {
  campanhaId: string;
  /** Nome da campanha para derivar o tenantId (slug).
   * Se não vier, cai no campanhaId. Se vier `tenantId`, ele prevalece. */
  campanhaNome?: string;
  /** Tenant opcional. Se informado, prevalece sobre campanhaNome. */
  tenantId?: string;
  onCodigoGerado?: (codigo: string) => void;
};

function slugify(input: string): string {
  return input
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export default function EnviarCodigoManual({
  campanhaId,
  campanhaNome,
  tenantId: tenantIdProp,
  onCodigoGerado,
}: Props) {
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading] = useState(false);
  const [derivedTenantId, setDerivedTenantId] = useState<string>('');
  const theme = useTheme();
  const user = getAuth().currentUser;

  // Resolve tenantId: prop > campanhaNome (slug) > campanhaId (slug)
  useEffect(() => {
    if (tenantIdProp) setDerivedTenantId(tenantIdProp);
    else if (campanhaNome) setDerivedTenantId(slugify(campanhaNome));
    else setDerivedTenantId(slugify(campanhaId));
  }, [tenantIdProp, campanhaNome, campanhaId]);

  const tenantId = useMemo(() => derivedTenantId, [derivedTenantId]);

  const validatePhone = (value: string): boolean => {
    const onlyDigits = value.replace(/\D/g, '');
    return /^[0-9]{10,11}$/.test(onlyDigits);
  };

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

  const gerarCodigo = async (): Promise<void> => {
    const rawPhone = telefone.replace(/\D/g, '');

    if (!tenantId) {
      toast.error('Tenant não resolvido. Verifique o nome/ID da campanha.');
      return;
    }
    if (!validatePhone(telefone)) {
      toast.error('Por favor, informe um número de telefone válido (10–11 dígitos).');
      return;
    }

    setLoading(true);
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

      // ===== Formato de mensagem + link (como solicitado) =====
      const siteLink = `${window.location.origin}/${campanhaId}/validador?${novoCodigo}`;
      const message =
        `Parabéns! Você ganhou uma ficha para jogar no *Pedidos da Sorte*! 🎉\n\n` +
        `Seu código é *${novoCodigo}*\n` +
        `Acesse: ${siteLink}`;

      // envia via WhatsApp (Next → Bot) COM tenantId
      await enviarWhatsapp(rawPhone, message);

      toast.success(`Código ${novoCodigo} enviado com sucesso!`);
      try { await navigator.clipboard.writeText(novoCodigo); } catch { /* ignore */ }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error('Erro: ' + msg);
    } finally {
      setLoading(false);
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
        <Stack spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="h6" component="h2" fontWeight="bold">
            Envio Manual de Código
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Tenant: <b>{tenantId || '—'}</b>
          </Typography>
        </Stack>

        <TextField
          fullWidth
          placeholder="(44) 91234-5678"
          value={telefone}
          onChange={(e) => setTelefone(formatPhone(e.target.value))}
          sx={{ mb: 2 }}
          inputProps={{ style: { textAlign: 'center' } }}
        />

        <Button
          fullWidth
          disabled={loading}
          onClick={() => void gerarCodigo()}
          size="large"
          sx={{
            bgcolor: theme.palette.primary.main,
            color: 'white',
            fontWeight: 'bold',
            '&:hover': { bgcolor: '#c70000' },
          }}
        >
          {loading ? 'Enviando…' : 'Gerar e enviar via WhatsApp'}
        </Button>
      </CardContent>
    </Card>
  );
}
