'use client'
import DashboardCard from '@/components/DashboardCard';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useRouter } from 'next/navigation';
import BaseDash from '../base';
import ProtegePagina from '@/components/ProtegePagina';
import { Container, Grid, Typography } from '@mui/material';
import LoadingOverlay from '@/components/LoadingOverlay';
import { useState } from 'react';


export default function EscolherJogo() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const handleClick = () => {
        setLoading(true);
        router.push('/dashboard/criar-sorteio')

    }

    return (
        <>
            <ProtegePagina permitido={['admin', 'empresa']}>
                <head>
                    <title>Escolher jogo - sorteio da sorteio</title>
                </head>
                <BaseDash>





                    <Container maxWidth="lg" sx={{ mt: 6 , display:'grid',  height:'60vh' }} >
                        <Typography component={'h1'} variant="h4" textAlign={'center'} gutterBottom>
                            Criar nova campanha
                        </Typography>
                        <Grid container spacing={2} sx={{
                            justifyContent:'center'
                        }}> 

                            <Grid size={{ xs: 12, md: 3 }} display={'flex'} justifyContent='center' >
                                <DashboardCard
                                    icon={<FontAwesomeIcon icon={faPlus} />}
                                    color='vermelho'
                                    title="Caixa surpresa"
                                    onClick={handleClick}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 3 }} display={'flex'} justifyContent='center'>
                                <DashboardCard
                                    icon={<FontAwesomeIcon icon={faPlus} />}
                                    color='vermelho'
                                    title="Raspadinha"
                                    onClick={handleClick}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, md: 3 }} display={'flex'} justifyContent='center'>
                                <DashboardCard
                                    icon={<FontAwesomeIcon icon={faPlus} />}
                                    color='vermelho'
                                    title="Roleta da sorte"
                                    onClick={handleClick}
                                />
                            </Grid>
                        </Grid>
                    </Container>
                </BaseDash>
                {loading && <LoadingOverlay texto="Redirecionando..." />}
            </ProtegePagina>
        </>
    )
}