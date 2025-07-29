/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Box, Button, Chip, Container, Grid, Typography } from '@mui/material';
// import { useRouter } from 'next/navigation';
import Head from 'next/head';
import PremiosResgatados from './PremiosResgatados';
import BaseDash from '../../base';

export default function DetalhesCampanhaPage() {
    const { id } = useParams();
    const [campanha, setCampanha] = useState<any>(null);
    // const router = useRouter();



    useEffect(() => {
        if (!id) return;

        const carregarCampanha = async () => {
            const docRef = doc(db, 'campanhas', id as string);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setCampanha({ id: docSnap.id, ...docSnap.data() });
            }
        };

        carregarCampanha();
    }, [id]);
    const campanhaId = id

    if (!id) {
        return <Typography>Campanha não encontrada</Typography>;
    }
    if (!campanha) return null;

    const porcentagemUtilizada = Math.round(
        (campanha.totalRaspadinhas - campanha.raspadinhasRestantes) /
        campanha.totalRaspadinhas *
        100
    );

    const porcentagemPremios = Math.round(
        (campanha.premiosTotais - campanha.premiosRestantes) /
        campanha.premiosTotais *
        100
    );

   
    return (
        <>

            <Head>
                <title>Campanha</title>
            </Head>
            <BaseDash>

                <Container maxWidth="lg" sx={{ mt: 6 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                        <Typography variant="h4">Campanha: {campanha.nome}</Typography>
                        <Chip
                            label={campanha.status?.toUpperCase() || 'INDISPONÍVEL'}
                            color={campanha.status === 'ativa' ? 'success' : 'default'}
                            variant="outlined"
                        />
                    </Box>

                    <Grid container spacing={4}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography>Quantidade Total de Raspadinhas: {campanha.totalRaspadinhas}</Typography>
                            <Typography>
                                Quantidade Utilizada: {campanha.totalRaspadinhas - campanha.raspadinhasRestantes} - {porcentagemUtilizada}%
                            </Typography>
                            <Typography>Quantidade Total de Prêmios: {campanha.premiosTotais}</Typography>
                            <Typography>
                                Quantidade de Prêmios já Sorteados: {campanha.premiosTotais - campanha.premiosRestantes} - {porcentagemPremios}%
                            </Typography>

                            <Box mt={4} display="flex" gap={2}>
                                <Button variant="contained" color="error">Pausar Campanha</Button>
                                <Button variant="contained" color="inherit">Finalizar Campanha</Button>
                            </Box>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box display="flex" flexDirection="column" gap={2}>
                                <Button variant="contained" color="inherit" >Prêmios Resgatados</Button>
                                <Button variant="contained" color="inherit">Prêmios NÃO Resgatados</Button>
                                <Button variant="contained" color="error">Números Premiados</Button>
                                <Button variant="contained" color="error">Números NÃO Premiados</Button>
                                <Button variant="contained" color="error">Relatório de Envio</Button>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <PremiosResgatados campanhaId={campanhaId} />
                        </Grid>
                    </Grid>
                </Container>
            </BaseDash>
        </>
    );
}
