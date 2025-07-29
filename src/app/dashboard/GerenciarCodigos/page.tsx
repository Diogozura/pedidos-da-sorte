'use client';

import { Box, Chip, Container, FormControl, Grid, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import BaseDash from '../base';
import ValidateVoucherPanel from './ValidateVoucher';
import { toast } from 'react-toastify';
import EnviarCodigoAutomatico from './EnviarCodigoAutomatico';
import EnviarCodigoManual from './EnviarCodigoManual';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';


interface Campanha {
    id: string;
    nome: string;
    status: 'ativa' | 'pausada' | 'encerrada';
}

export default function GerenciarCodigos() {
    const handleEnvio = (telefone: string) => {
        // Aqui você pode usar a lógica que estava no `gerarCodigo`
        toast.success(`Enviar código para ${telefone}`);
    };
    const [campanhas, setCampanhas] = useState<Campanha[]>([]);
    const [campanhaSelecionada, setCampanhaSelecionada] = useState<string>('');

    useEffect(() => {
        const fetchCampanhas = async () => {
            const snap = await getDocs(collection(db, 'campanhas'));
            const list = snap.docs.map(doc => ({
                id: doc.id,
                nome: doc.data().nome,
                status: doc.data().status || 'ativa',
            }));
            setCampanhas(list);

        };
        fetchCampanhas();
    }, []);
    const campanha = campanhas.find((c) => c.id === campanhaSelecionada);




    return (
        <BaseDash>
            <Container maxWidth="lg" sx={{ mt: 6 }}>
                <Typography component={'h1'} textAlign={'center'} py={2} variant='h2'>Gerenciador de Códigos</Typography>
                <Box maxWidth={400} mx="auto" mb={4}>
                    <FormControl fullWidth>
                        <InputLabel id="campanha-select-label">Selecionar Campanha</InputLabel>
                        <Select
                            labelId="campanha-select-label"
                            value={campanhaSelecionada}
                            label="Selecionar Campanha"
                            onChange={(e) => setCampanhaSelecionada(e.target.value)}
                        >
                            {campanhas.map((camp) => (
                                <MenuItem key={camp.id} value={camp.id}>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Chip
                                            size="small"
                                            label={camp.status.toUpperCase()}
                                            color={camp.status === 'ativa' ? 'success' : 'default'}
                                        />
                                        {camp.nome}
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
                <Grid container spacing={4} justifyContent="center" alignItems="stretch">

                    <Grid size={{ xs: 12, md: 6 }} >
                        <EnviarCodigoManual campanhaId={campanha?.id || ''} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <ValidateVoucherPanel />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <EnviarCodigoAutomatico onSend={handleEnvio} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>

                    </Grid>
                </Grid>
            </Container>
        </BaseDash>
    );
}
