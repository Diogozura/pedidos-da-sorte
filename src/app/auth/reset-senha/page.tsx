'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    Box,
    TextField,
    Typography,
    Button,
    Alert,
    Stack,
    Container,
} from '@mui/material';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import Image from 'next/image';

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ResetSenhaPage() {
    const [email, setEmail] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    const handleSubmit = async () => {
        setFeedback(null);

        if (!isValidEmail(email)) {
            setFeedback({ type: 'error', msg: 'Informe um e-mail válido.' });
            return;
        }

        setLoading(true);
        try {
            const auth = getAuth();
            await sendPasswordResetEmail(auth, email, {
                url: 'https://sistema.pedidodasorte.com.br/auth/login',
                handleCodeInApp: false,
            });

            // Mensagem genérica para evitar enumeração de usuários:
            setFeedback({
                type: 'success',
                msg: 'Se este e-mail estiver cadastrado, você receberá instruções para redefinir a senha.',
            });
        } catch {
            // Mesmo em erro, evitamos revelar existência do e-mail.
            setFeedback({
                type: 'success',
                msg: 'Se este e-mail estiver cadastrado, você receberá instruções para redefinir a senha.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (

        <Container maxWidth="sm"
            sx={{
                height: '70vh',

                alignContent: 'center',
                justifyContent: 'center',
                textAlign: 'center',
            }}>
           
           
                    <Stack spacing={2}>
                        <Box textAlign="center" mb={4}><Image width={200} height={80} src={'/Logo-original.png'} alt="Logo principal , Pedidos da sorte" /></Box>
                        <Typography variant="h5" fontWeight={600}>
                            Redefinir senha
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Informe seu e-mail para receber o link de redefinição.
                        </Typography>

                        <TextField
                            label="E-mail"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            size="small"
                            fullWidth
                            autoComplete="email"
                            inputProps={{ inputMode: 'email' }}
                        />

                        {feedback && (
                            <Alert severity={feedback.type} variant="outlined">
                                {feedback.msg}
                            </Alert>
                        )}

                        <Button
                            onClick={handleSubmit}
                            variant="contained"
                            disabled={loading}
                            size="medium"
                        >
                            {loading ? 'Enviando…' : 'Enviar link'}
                        </Button>

                        <Typography variant="body2" textAlign="center">
                            Lembrou a senha?{' '}
                            <Link href="/auth/login">Voltar ao login</Link>
                        </Typography>
                    </Stack>
        
        </Container>
    );
}
