'use client';

import useTenantEmpresa from '@/hook/useTenantEmpresa';

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Container,

    Grid,

    Stack,

    Table,

    TableBody,

    TableCell,

    TableContainer,

    TableHead,

    TableRow,

    TextField,

    Typography,

} from "@mui/material";


import BaseDash from '../base';

import { faArrowsRotate, faCircleCheck, faCircleNotch, faHome, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import AppBreadcrumbs from "@/components/shared/AppBreadcrumbs";
import { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';

type GlobalStatus =
    | 'desconhecido'
    | 'iniciando'
    | 'aguardando_qr'
    | 'conectando'
    | 'conectado'
    | 'desconectado'
    | 'erro';


type StatusResponse = {
    status: GlobalStatus;
    updatedAt?: string | null;
};

type MessageLog = {
    to: string;
    messageId: string | null;
    status: string | undefined;
    error: string | null;
    ts: string; // ISO que vem do server (ou Date.toString)
};

type TenantLogsResponse = {
    tenantId: string;
    count: number;
    logs: MessageLog[];
};

type ReconnectResp = { ok: boolean; hard?: boolean; status?: StatusResponse; error?: string };




export default function WhatsApp() {
    const [status, setStatus] = useState<GlobalStatus>('desconhecido');
    const [qrBuster, setQrBuster] = useState<number>(Date.now());
    const [loadingStatus, setLoadingStatus] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [logs, setLogs] = useState<MessageLog[]>([]);
    const [loadingLogs, setLoadingLogs] = useState<boolean>(false);
    const lastStatusRef = useRef<GlobalStatus>('desconhecido');
    const [showScanning, setShowScanning] = useState<boolean>(false);

    const { loading, isEmpresa, tenantId } = useTenantEmpresa();


    // --------- helpers de fetch (sem cache) ----------
    const fetchJSON = async <T,>(url: string): Promise<T> => {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return (await res.json()) as T;
    };
    useEffect(() => {
        if (!tenantId) return;
        void refreshStatus();
        const id = setInterval(() => void refreshStatus(), 6000);
        return () => clearInterval(id);
    }, [tenantId]);



    const postJSON = async <T,>(url: string, body: unknown): Promise<T> => {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            cache: 'no-store',
        });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return (await res.json()) as T;
    };

    const refreshStatus = async () => {
        try {
            setLoadingStatus(true);
            const data = await fetchJSON<StatusResponse>(`/api/whats/status?tenantId=${encodeURIComponent(tenantId ?? '')}`);
            setStatus(data.status);

            // se saiu de aguardando_qr para outro estado != conectado → pisca "escaneando…"
            if (
                lastStatusRef.current === 'aguardando_qr' &&
                data.status !== 'aguardando_qr' &&
                data.status !== 'conectado'
            ) {
                setShowScanning(true);
                setTimeout(() => setShowScanning(false), 20000);
            }
            lastStatusRef.current = data.status;

            if (data.status === 'aguardando_qr') setQrBuster(Date.now());
            setError(null);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoadingStatus(false);
        }
    };

    const refreshLogs = async () => {
        if (!tenantId) return;
        try {
            setLoadingLogs(true);
            const data = await fetchJSON<TenantLogsResponse>(`/api/whats/logs/${encodeURIComponent(tenantId ?? '')}`);
            const normalized = data.logs.map((l) => ({ ...l, ts: new Date(l.ts).toISOString() }));
            setLogs(normalized);
        } catch (err) {
            console.warn('Falha ao carregar logs:', err);
        } finally {
            setLoadingLogs(false);
        }
    };

    const doReconnect = async (hard = false) => {
        try {
            await postJSON<ReconnectResp>(`/api/whats/reconnect?tenantId=${encodeURIComponent(tenantId ?? '')}&hard=${hard ? 1 : 0}`, { hard });
            await refreshStatus();
        } catch (e) {
            setError(`reconnect: ${(e as Error).message}`);
        }
    };


    // --------- polling dos logs quando conectado -----------
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
        if (status !== 'conectado') return;
        void refreshLogs();
        const id = setInterval(() => void refreshLogs(), 8000);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, tenantId]);
    // --------- init ------------


    const isWaitingQR = status === 'aguardando_qr';
    const isConnected = status === 'conectado';

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const statusChip = useMemo(() => {
        if (showScanning) {
            return (
                <Stack direction="row" alignItems="center" spacing={1}>
                    <FontAwesomeIcon icon={faCircleNotch} spin />
                    <Typography variant="body2">escaneando…</Typography>
                </Stack>
            );
        }

        if (isWaitingQR) {
            return (
                <Stack direction="row" alignItems="center" spacing={1}>
                    <FontAwesomeIcon icon={faWhatsapp} />
                    <Typography variant="body2">aguardando QR</Typography>
                </Stack>
            );
        }

        if (isConnected) {
            return (
                <Stack direction="row" alignItems="center" spacing={1}>
                    <FontAwesomeIcon icon={faCircleCheck} />
                    <Typography variant="body2" color="success.main">conectado</Typography>
                </Stack>
            );
        }

        // demais estados
        return (
            <Stack direction="row" alignItems="center" spacing={1}>
                <FontAwesomeIcon icon={faCircleNotch} spin />
                <Typography variant="body2">{status}</Typography>
            </Stack>
        );
    }, [isConnected, isWaitingQR, showScanning, status]);

    // >>> Decida o que renderizar SÓ AQUI (depois de todos hooks)
    if (loading) {
        return (
            <BaseDash>
                <Container maxWidth="lg" sx={{ py: 3 }}>
                    <Typography variant="body2">Carregando…</Typography>
                </Container>
            </BaseDash>
        );
    }

    if (!isEmpresa) {
        return (
            <BaseDash>
                <Container maxWidth="lg" sx={{ py: 3 }}>
                    <Alert severity="info">Somente contas do tipo empresa</Alert>
                </Container>
            </BaseDash>
        );
    }


    return (
        <BaseDash>
            <Container maxWidth="lg" sx={{ py: 3 }}>
                <AppBreadcrumbs
                    items={[
                        { label: 'Início', href: '/dashboard', icon: faHome },
                        { label: 'WhatsApp', },
                    ]}
                />
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <FontAwesomeIcon icon={faWhatsapp} />
                    <Typography variant="h5">Conecte WhatsApp</Typography>
                </Stack>

                {error && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        <FontAwesomeIcon icon={faTriangleExclamation} style={{ marginRight: 8 }} />
                        Falha ao consultar status ({error}). Verifique se a API está ativa e sua sessão está válida.
                    </Alert>
                )}

                <Card variant="outlined" sx={{ mb: 3 }}>
                    <CardContent>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <Typography variant="body1">Status:</Typography>
                                {statusChip}
                            </Stack>

                            <Button
                                size="small"
                                variant="outlined"
                                startIcon={<FontAwesomeIcon icon={faArrowsRotate} />}
                                onClick={() => void refreshStatus()}
                                disabled={loadingStatus}
                            >
                                Atualizar
                            </Button>
                            <Button
                                size="small"
                                variant="contained"
                                onClick={() => void doReconnect(false)}
                                disabled={loadingStatus}
                            >
                                Reconectar
                            </Button>
                            {/* Hard reset (opcional) — deixa visível só pra admin/dev */}
                            <Button
                                size="small"
                                variant="outlined"
                                color="warning"
                                onClick={() => {
                                    if (confirm('Hard reset vai exigir novo QR. Continuar?')) {
                                        void doReconnect(true);
                                    }
                                }}
                            >
                                gerar QR code
                            </Button>
                        </Stack>

                        {/* Bloco do QR */}
                        {isWaitingQR && (
                            <Grid container spacing={2} sx={{ mt: 2 }}>
                                <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                                    <Box
                                        component="img"
                                        // usa o proxy do Next para servir a imagem (com cache-buster)
                                        src={`/api/whats/qr-image?tenantId=${encodeURIComponent(tenantId ?? '')}&cb=${qrBuster}`} // sempre via Next
                                        alt="QR Code WhatsApp"
                                        onError={() => setTimeout(() => setQrBuster(Date.now()), 2000)}
                                        sx={{
                                            width: '100%',
                                            maxWidth: 240,
                                            borderRadius: 1,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 8, md: 9 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Conecte o WhatsApp
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Abra o WhatsApp &gt; Dispositivos conectados &gt; Conectar dispositivo. Escaneie o QR ao lado.
                                    </Typography>
                                </Grid>
                            </Grid>
                        )}
                    </CardContent>
                </Card>

                {/* Área de logs / envios (só quando conectado) */}
                <Card variant="outlined">
                    <CardContent>
                        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2} mb={2}>
                            <Typography variant="h6" sx={{ flex: 1 }}>
                                Envios por tenant
                            </Typography>
                            <TextField
                                size="small"
                                label="Tenant ID"
                                value={tenantId ?? ''}
                                InputProps={{ readOnly: true }}
                                sx={{ width: { xs: '100%', sm: 280 } }}
                            />
                            <Button
                                size="small"
                                variant="contained"
                                onClick={() => void refreshLogs()}
                                disabled={!isConnected || loadingLogs}
                            >
                                Atualizar logs
                            </Button>
                        </Stack>

                        {!isConnected ? (
                            <Alert severity="info">
                                Conecte o WhatsApp para visualizar os envios.
                            </Alert>
                        ) : (
                            <TableContainer sx={{ maxHeight: 460, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                <Table stickyHeader size="small" aria-label="tabela de envios">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Data/Hora</TableCell>
                                            <TableCell>Telefone</TableCell>
                                            <TableCell>Message ID</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Erro</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {logs.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Nenhum envio registrado para “{tenantId}”.
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            logs
                                                .slice()
                                                .reverse()
                                                .map((row, idx) => (
                                                    <TableRow key={`${row.messageId || 'sem-id'}-${idx}`}>
                                                        <TableCell>{formatLocal(row.ts)}</TableCell>
                                                        <TableCell>{row.to}</TableCell>
                                                        <TableCell sx={{ fontFamily: 'monospace' }}>{row.messageId || '—'}</TableCell>
                                                        <TableCell>{row.status ?? '—'}</TableCell>
                                                        <TableCell sx={{ color: row.error ? 'error.main' : 'text.secondary' }}>
                                                            {row.error || '—'}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </CardContent>
                </Card>
            </Container>
        </BaseDash>
    );
}

// -------- utils --------
function formatLocal(isoOrDateStr: string): string {
    const d = new Date(isoOrDateStr);
    if (isNaN(d.getTime())) return isoOrDateStr;
    return d.toLocaleString();
}