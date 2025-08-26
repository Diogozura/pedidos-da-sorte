/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Box, Button, Chip, Container, Grid, Typography } from '@mui/material';
// import { useRouter } from 'next/navigation';
import Head from 'next/head';
import BaseDash from '../../base';
import { toast } from 'react-toastify';
import NumerosPremiados from '@/components/NumerosPremiados';
import RelatorioEnvioCampanha from '@/components/RelatorioEnvioCampanha';
import AppBreadcrumbs from '@/components/shared/AppBreadcrumbs';
import { faHome } from '@fortawesome/free-solid-svg-icons';
import PremiosTabela from './PremiosTabela';

export default function DetalhesCampanhaPage() {
    const { id } = useParams();
    const [campanha, setCampanha] = useState<any>(null);
    type Aba =
        | 'resgatados'
        | 'naoResgatados'
        | 'premiados'
        | 'naoPremiados'
        | 'envio';

    const [abaAtual, setAbaAtual] = useState<Aba>('resgatados');

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

    const handleFinalizarCampanha = async () => {
        if (!campanhaId) return;

        const confirmar = window.confirm('Tem certeza que deseja encerrar esta campanha? Isso é irreversível.');
        if (!confirmar) return;

        try {
            await updateDoc(doc(db, 'campanhas', campanha.id), {
                status: 'encerrada',
            });
            toast.success('Campanha encerrada com sucesso!');
            setCampanha((prev: any) => ({ ...prev, status: 'encerrada' }));
        } catch (error) {
            console.error(error);
            toast.error('Erro ao encerrar campanha.');
        }
    };

    return (
        <>

            <Head>
                <title>Campanha</title>
            </Head>
            <BaseDash>
                <Container maxWidth="md" sx={{ mt: 6 }}>

                </Container>

                <Container maxWidth="lg" sx={{ mt: 6 }}>
                    <AppBreadcrumbs
                        items={[
                            { label: 'Início', href: '/dashboard', icon: faHome },
                            { label: 'Campanhas', href: '/dashboard/campanhas' },
                            { label: 'minha campanha', },
                        ]}
                    />
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
                                <Button
                                    variant="contained"
                                    color={campanha.status === 'pausada' ? 'success' : 'error'}
                                    disabled={campanha.status === 'encerrada'}
                                    onClick={async () => {
                                        const novoStatus = campanha.status === 'pausada' ? 'ativa' : 'pausada';

                                        try {
                                            await updateDoc(doc(db, 'campanhas', campanha.id), {
                                                status: novoStatus,
                                            });
                                            toast.success(`Campanha ${novoStatus === 'ativa' ? 'ativada' : 'pausada'} com sucesso!`);
                                            setCampanha((prev: any) => ({ ...prev, status: novoStatus }));
                                        } catch (error) {
                                            console.error(error);
                                            toast.error('Erro ao atualizar status da campanha.');
                                        }
                                    }}
                                >
                                    {campanha.status === 'pausada' ? 'Ativar Campanha' : 'Pausar Campanha'}
                                </Button>
                                <Button
                                    variant="contained"
                                    color="inherit"
                                    onClick={handleFinalizarCampanha}
                                    disabled={campanha.status === 'encerrada'}
                                >
                                    Finalizar Campanha
                                </Button>
                            </Box>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box display="flex" flexDirection="column" gap={2}>
                                <Button
                                    variant={abaAtual === 'resgatados' ? 'contained' : 'outlined'}
                                    onClick={() => setAbaAtual('resgatados')}
                                >
                                    Prêmios Resgatados
                                </Button>
                                <Button
                                    variant={abaAtual === 'naoResgatados' ? 'contained' : 'outlined'}
                                    onClick={() => setAbaAtual('naoResgatados')}
                                >
                                    Prêmios NÃO Resgatados
                                </Button>
                                {/* <Button
                                    variant={abaAtual === 'premiados' ? 'contained' : 'outlined'}
                                    color="error"
                                    onClick={() => setAbaAtual('premiados')}
                                >
                                    Números Premiados
                                </Button> */}
                                {/* <Button
                                    variant={abaAtual === 'naoPremiados' ? 'contained' : 'outlined'}
                                    color="error"
                                    onClick={() => setAbaAtual('naoPremiados')}
                                >
                                    Números NÃO Premiados
                                </Button> */}
                                <Button
                                    variant={abaAtual === 'envio' ? 'contained' : 'outlined'}
                                    color="error"
                                    onClick={() => setAbaAtual('envio')}
                                >
                                    Relatório de Envio
                                </Button>

                            </Box>
                        </Grid>
                        <Grid size={12}>
                            {abaAtual === 'resgatados' && <PremiosTabela campanhaId={campanha.id} mode="resgatados" />}
                            {abaAtual === 'naoResgatados' && <PremiosTabela campanhaId={campanha.id} mode="naoResgatados" />}
                            {abaAtual === 'premiados' && <NumerosPremiados campanhaId={campanha.id} mostrar="premiados" />}
                            {abaAtual === 'naoPremiados' && <NumerosPremiados campanhaId={campanha.id} mostrar="naoPremiados" />}
                            {abaAtual === 'envio' && <RelatorioEnvioCampanha campanhaId={campanha.id} />}
                        </Grid>

                    </Grid>
                </Container>
            </BaseDash>
        </>
    );
}
