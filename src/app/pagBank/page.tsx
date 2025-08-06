'use client';

import { Container, Typography, } from '@mui/material';
import { BaseSorteio } from '@/components/BaseSorteio';



export default function GanhadorPage() {

    return (
        <BaseSorteio >
            <Container maxWidth="md" sx={{ height: '80vh', display: 'grid', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <Typography component={'h1'} variant="h4" gutterBottom>
                    🎉 Parabéns! pelos 10% desconto.
                </Typography>
                <Typography component={'h2'} variant="body1" gutterBottom>
                    Tela pagbank
                </Typography>


            </Container>
        </BaseSorteio>
    );
}
