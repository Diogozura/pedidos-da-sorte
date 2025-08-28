'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Box,
  TextField,
  Typography,
  Button,
  Alert,
  IconButton,
  InputAdornment,
  LinearProgress,
  Stack,
  Container,
} from '@mui/material';
import { getAuth, verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

type Strength = 'fraca' | 'ok' | 'forte';

function passwordStrength(pwd: string): Strength {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return 'fraca';
  if (score === 2) return 'ok';
  return 'forte';
}

type Props = { oobCode: string };

export default function NovaSenhaClient({ oobCode }: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(true);
  const [validCode, setValidCode] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [pwd, setPwd] = useState<string>('');
  const [pwd2, setPwd2] = useState<string>('');
  const [showPwd, setShowPwd] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const strength = useMemo(() => passwordStrength(pwd), [pwd]);

  useEffect(() => {
    const auth = getAuth();

    if (!oobCode) {
      setFeedback({ type: 'error', msg: 'Link inválido.' });
      setLoading(false);
      setValidCode(false);
      return;
    }

    verifyPasswordResetCode(auth, oobCode)
      .then((userEmail) => {
        setEmail(userEmail);
        setValidCode(true);
      })
      .catch(() => {
        setFeedback({ type: 'error', msg: 'Código inválido ou expirado.' });
        setValidCode(false);
      })
      .finally(() => setLoading(false));
  }, [oobCode]);

  const canSubmit = pwd.length >= 8 && pwd === pwd2 && validCode;

  const handleConfirm = async () => {
    setFeedback(null);
    if (!canSubmit) {
      setFeedback({ type: 'error', msg: 'Verifique a nova senha e a confirmação.' });
      return;
    }

    try {
      const auth = getAuth();
      await confirmPasswordReset(auth, oobCode, pwd);
      setFeedback({ type: 'success', msg: 'Senha alterada com sucesso! Redirecionando…' });
      setTimeout(() => router.push('/auth/login'), 1600);
    } catch {
      setFeedback({ type: 'error', msg: 'Não foi possível redefinir a senha. Tente novamente.' });
    }
  };

  return (
    <Container
      maxWidth="sm"
      sx={{ height: '70vh', alignContent: 'center', justifyContent: 'center', textAlign: 'center' }}
    >
      {loading && <LinearProgress />}

      <Stack spacing={2}>
        <Typography variant="h5" fontWeight={600}>
          Definir nova senha
        </Typography>

        {!loading && !validCode && (
          <>
            {feedback && <Alert severity={feedback.type}>{feedback.msg}</Alert>}
            <Typography variant="body2">
              Volte para o <Link href="/auth/reset-senha">reenvio do link</Link>.
            </Typography>
          </>
        )}

        {!loading && validCode && (
          <>
            <Typography variant="body2" color="text.secondary">
              Conta: <b>{email}</b>
            </Typography>

            <TextField
              label="Nova senha"
              type={showPwd ? 'text' : 'password'}
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              size="small"
              fullWidth
              autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPwd ? 'Ocultar senha' : 'Mostrar senha'}
                      onClick={() => setShowPwd((s) => !s)}
                      edge="end"
                      size="small"
                    >
                      <FontAwesomeIcon icon={showPwd ? faEyeSlash : faEye} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              helperText="Mínimo de 8 caracteres. Use letras maiúsculas/minúsculas e números ou símbolos."
            />

            <TextField
              label="Confirmar senha"
              type={showPwd ? 'text' : 'password'}
              value={pwd2}
              onChange={(e) => setPwd2(e.target.value)}
              size="small"
              fullWidth
              autoComplete="new-password"
              error={pwd2.length > 0 && pwd2 !== pwd}
              helperText={pwd2.length > 0 && pwd2 !== pwd ? 'As senhas não coincidem.' : ' '}
            />

            <Box>
              <Typography variant="caption" color="text.secondary">
                Força da senha: {strength}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={strength === 'fraca' ? 33 : strength === 'ok' ? 66 : 100}
                sx={{ mt: 0.5, borderRadius: 1 }}
              />
            </Box>

            {feedback && <Alert severity={feedback.type}>{feedback.msg}</Alert>}

            <Button onClick={handleConfirm} variant="contained" disabled={!canSubmit} size="medium">
              Salvar nova senha
            </Button>

            <Typography variant="body2" textAlign="center">
              Lembrou a senha? <Link href="/auth/login">Voltar ao login</Link>
            </Typography>
          </>
        )}
      </Stack>
    </Container>
  );
}
