'use client';

import { useEffect, useState, ChangeEvent } from 'react';
import { db } from '@/lib/firebase';
import {
    collection,
    getDocs,
    addDoc,
    query,
    where,
    Timestamp,
    updateDoc,
    doc,
} from 'firebase/firestore';
import {
    Container,
    Grid,
    Typography,
    Card,
    CardContent,
    CardActions,
    Button,
    TextField,
    Box,
    Tabs,
    Tab,
    List,
    ListItem,
    ListItemText
} from '@mui/material';
import { toast } from 'react-toastify';
import BaseDash from '../base';
import { formatPhone } from '@/utils/formatPhone';
import { getAuth } from 'firebase/auth';
import ValidateVoucherPanel from './ValidateVoucher';

interface Campanha {
    id: string;
    nome: string;
    raspadinhasRestantes: number;
    premiosRestantes: number;
    premiosTotais: number;
    totalRaspadinhas: number;
}

interface Codigo {
    id: string;
    codigo: string;
    status: string;
    criadoEm?: Timestamp;
    usadoEm?: Timestamp;
    premiado?: string;
}

export default function EnviarCodigos() {
    const [campanhas, setCampanhas] = useState<Campanha[]>([]);
    const [codigosPorCampanha, setCodigosPorCampanha] = useState<Record<string, Codigo[]>>({});
    const [phones, setPhones] = useState<Record<string, string>>({});
    const [phoneValid, setPhoneValid] = useState<Record<string, boolean>>({});
    const auth = getAuth();
    const user = auth.currentUser;
    const [tabIndex, setTabIndex] = useState(0);

    const handleTabChange = (_: React.SyntheticEvent, newIndex: number) => {
        setTabIndex(newIndex);
    };

    useEffect(() => {
        const fetchCampanhasECodigos = async () => {
            const campSnap = await getDocs(collection(db, 'campanhas'));
            const campList: Campanha[] = [];
            const codesMap: Record<string, Codigo[]> = {};

            for (const campDoc of campSnap.docs) {
                const data = campDoc.data();
                const camp: Campanha = {
                    id: campDoc.id,
                    nome: data.nome,
                    raspadinhasRestantes: data.raspadinhasRestantes,
                    premiosRestantes: data.premiosRestantes,
                    premiosTotais: data.premiosTotais,
                    totalRaspadinhas: data.totalRaspadinhas,
                };
                campList.push(camp);

                const codesSnap = await getDocs(
                    query(collection(db, 'codigos'), where('campanhaId', '==', campDoc.id))
                );
                const listaCodigos: Codigo[] = codesSnap.docs.map(cd => ({
                    id: cd.id,
                    codigo: cd.data().codigo,
                    status: cd.data().status,
                    criadoEm: cd.data().criadoEm,
                    usadoEm: cd.data().usadoEm,
                    premiado: cd.data().premiado,
                }));
                codesMap[campDoc.id] = listaCodigos;
            }

            setCampanhas(campList);
            setCodigosPorCampanha(codesMap);
        };
        fetchCampanhasECodigos();
    }, []);

    const validatePhone = (value: string) => {
        const onlyDigits = value.replace(/\D/g, '');
        return /^[0-9]{10,11}$/.test(onlyDigits);
    };

    const handlePhoneChange = (campanhaId: string) => (e: ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const masked = formatPhone(val);
        setPhones(prev => ({ ...prev, [campanhaId]: masked }));
        setPhoneValid(prev => ({ ...prev, [campanhaId]: validatePhone(masked) }));
    };

    const gerarCodigo = async (campanhaId: string) => {
        const rawPhone = phones[campanhaId]?.replace(/\D/g, '');
        if (!phoneValid[campanhaId]) {
            toast.error('Por favor, informe um número de telefone válido.');
            return;
        }

        try {
            const posicoesSnap = await getDocs(
                query(collection(db, 'campanhas', campanhaId, 'posicoes'), where('usado', '==', false))
            );
            if (posicoesSnap.empty) {
                toast.warning('Sem posições disponíveis para essa campanha.');
                return;
            }
            const posDoc = posicoesSnap.docs[0];
            const posData = posDoc.data();
            const posId = posDoc.id;

            const novoCodigo = Math.random().toString(36).substring(2, 8).toUpperCase();
            const codigoRef = await addDoc(collection(db, 'codigos'), {
                codigo: novoCodigo,
                campanhaId,
                telefone: rawPhone,
                userId: user?.uid,
                posicao: posId,
                criadoEm: Timestamp.now(),
                status: 'ativo',
                usado: false,
                premiado: posData.prize || 'nenhum',
            });

            await updateDoc(
                doc(db, 'campanhas', campanhaId, 'posicoes', posId),
                { usado: true }
            );

            const novo: Codigo = {
                id: codigoRef.id,
                codigo: novoCodigo,
                status: 'ativo',
                premiado: posData.prize || 'nenhum',
            };
            setCodigosPorCampanha(prev => ({
                ...prev,
                [campanhaId]: [...(prev[campanhaId] || []), novo],
            }));

            toast.success(`Código gerado: ${novoCodigo}`);
            navigator.clipboard.writeText(novoCodigo);

            const siteLink = `${window.location.origin}/sorteio`;
            const message = `Parabéns você ganhou uma ficha para jogar no Pedidos da Sorte! Seu código é ${novoCodigo} – acesse ${siteLink}`;
            const whatsappURL = `https://api.whatsapp.com/send?phone=55${rawPhone}&text=${encodeURIComponent(message)}`;
            window.open(whatsappURL, '_blank');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            toast.error('Erro ao gerar código: ' + err.message);
        }
    };

    return (
        <BaseDash>
            <Container maxWidth="md" sx={{ mt: 6 }}>
                <Typography variant="h4" gutterBottom>
                    Gerenciamento de Códigos
                </Typography>

                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabIndex} onChange={handleTabChange}>
                        <Tab label="Enviar Códigos" />
                        <Tab label="Validar Voucher" />
                    </Tabs>
                </Box>

                {tabIndex === 0 && (
                    <Box sx={{ mt: 3 }}>
                        <Grid container spacing={3}>
                            {campanhas.map(camp => (
                                <Grid size={12}  key={camp.id}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6">{camp.nome}</Typography>
                                            <TextField
                                                label="Telefone"
                                                placeholder="(44) 91234-5678"
                                                fullWidth
                                                margin="normal"
                                                value={phones[camp.id] || ''}
                                                onChange={handlePhoneChange(camp.id)}
                                                error={phones[camp.id] !== undefined && !phoneValid[camp.id]}
                                                helperText={
                                                    phones[camp.id] !== undefined && !phoneValid[camp.id]
                                                        ? 'Informe 10 ou 11 dígitos'
                                                        : ''
                                                }
                                            />

                                            <List dense>
                                                {(codigosPorCampanha[camp.id] || []).slice(-3).reverse().map((codigo) => (
                                                    <ListItem key={codigo.id}>
                                                        <ListItemText
                                                            primary={`Código: ${codigo.codigo}`}
                                                            secondary={`Status: ${codigo.status} ${codigo.premiado !== 'nenhum' ? '• Prêmio: ' + codigo.premiado : ''}`}
                                                        />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </CardContent>
                                        <CardActions>
                                            <Button
                                                variant="contained"
                                                onClick={() => gerarCodigo(camp.id)}
                                                disabled={camp.raspadinhasRestantes <= 0 || !phoneValid[camp.id]}
                                            >
                                                {camp.raspadinhasRestantes > 0
                                                    ? 'Enviar para WhatsApp'
                                                    : 'Campanha Encerrada'}
                                            </Button>
                                        </CardActions>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                )}

                {tabIndex === 1 && (
                    <Box sx={{ mt: 3 }}>
                        <ValidateVoucherPanel />
                    </Box>
                )}
            </Container>
        </BaseDash>
    );
}
