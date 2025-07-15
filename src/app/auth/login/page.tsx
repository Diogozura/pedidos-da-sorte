'use client';

import { auth, googleProvider } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import {
  Button,
  Container,
  TextField,
  Typography,
  Divider,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useFormContext } from '@/config/FormContext'; // importa seu contexto

export default function LoginPage() {
  const router = useRouter();
  const { formValues, setFormValues } = useFormContext();

  const values = formValues['login'] || { email: '', senha: '' };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues('login', { [name]: value });
  };

  const loginEmailSenha = async () => {
     router.push('/dashboard');
    // try {
    //   await signInWithEmailAndPassword(auth, values.email, values.senha);
    //   router.push('/dashboard');
    // } catch (err: any) {
    //   alert('Erro ao entrar: ' + err.message);
    // }
  };

  const loginGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      router.push('/dashboard');
    } catch (err: any) {
      alert('Erro ao entrar com Google: ' + err.message);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Typography variant="h4" gutterBottom>
        Entrar na sua conta
      </Typography>

      <TextField
        fullWidth
        label="Email"
        type="email"
        name="email"
        value={values.email || ''}
        sx={{ mb: 2 }}
        onChange={handleInputChange}
      />
      <TextField
        fullWidth
        label="Senha"
        type="password"
        name="senha"
        value={values.senha || ''}
        sx={{ mb: 2 }}
        onChange={handleInputChange}
      />

      <Button fullWidth variant="contained" onClick={loginEmailSenha}>
        Entrar com Email e Senha
      </Button>

      <Divider sx={{ my: 3 }}>ou</Divider>

      <Button fullWidth variant="outlined" onClick={loginGoogle}>
        Entrar com Google
      </Button>
    </Container>
  );
}
