'use client';

import { Box, Button, Container, Grid, Typography, Card, CardContent, Rating } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faMagicWandSparkles } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

export default function BannerPrincipal() {
    return (
        <Box sx={{ py: 8, backgroundColor: '#fff5f5' }}>
            <Container maxWidth="lg">
                <Typography variant="body2" color="error" fontWeight="bold" mb={2}>
                    <FontAwesomeIcon icon={faMagicWandSparkles} style={{ marginRight: 8 }} />
                    Sua sorte começa aqui!
                </Typography>

                <Grid container spacing={4} alignItems="center">
                    {/* Lado Esquerdo */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
                            Pedidos da <Box component="span" color="error.main">Sorte</Box>
                        </Typography>
                        <Typography variant="body1" color="text.secondary" paragraph>
                            Transformamos seus sonhos em realidade através de campanhas de marketing inovadoras e sorteios emocionantes.
                            Experimente nossa raspadinha exclusiva e descubra o que o destino preparou para você!
                        </Typography>

                        <Box mt={3} display="flex" gap={2}>
                            <Link href="/sorteio" passHref>
                                <Button variant="contained" color="error" size="large" endIcon={<FontAwesomeIcon icon={faArrowRight} />}>
                                    Jogar Raspadinha
                                </Button>
                            </Link>

                            <Button variant="outlined" color="error" size="large"
                                onClick={() => {
                                    const el = document.getElementById('saiba-mais');
                                    if (el) {
                                        el.scrollIntoView({ behavior: 'smooth' });
                                    }
                                }}
                            >
                                Saiba Mais
                            </Button>
                        </Box>

                        <Box mt={6} display="flex" gap={4}>
                            <Stat label="Sorteios Realizados" value="1000+" />
                            <Stat label="Participantes" value="50k+" />
                            <Stat label="Satisfação" value="98%" />
                        </Box>
                    </Grid>

                    {/* Lado Direito */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Card sx={{ boxShadow: 6, borderRadius: 3, px: 4, py: 6, textAlign: 'center' }}>
                            <Box sx={{ fontSize: '6rem', lineHeight: 1 }}>
                                🐞
                            </Box>

                            <CardContent>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    Sua Joaninha da Sorte
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Pronta para trazer fortuna e alegria!
                                </Typography>
                                <Rating value={5} readOnly />
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}

interface StatProps {
    label: string;
    value: string;
}

function Stat({ label, value }: StatProps) {
    return (
        <Box>
            <Typography variant="h6" color="error" fontWeight="bold">
                {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
                {label}
            </Typography>
        </Box>
    );
}
