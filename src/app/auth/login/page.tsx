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
import { useFormContext } from '@/config/FormContext';
import { toast } from 'react-toastify';

export default function LoginPage() {
  const router = useRouter();
  const { formValues, setFormValues } = useFormContext();

 const values = {
  email: formValues?.login?.email || '',
  senha: formValues?.login?.senha || '',
};

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues('login', { [name]: value });
  };

  const loginEmailSenha = async () => {
    if (!values.email || !values.senha) {
      toast.error('Preencha o email e a senha!');
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, values.email, values.senha);
      toast.success('Login realizado com sucesso! 🎉');
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err: any) {
      toast.error('Erro ao entrar: ' + err.message);
    }
  };

  const loginGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Login com Google realizado! ✅');
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err: any) {
      toast.error('Erro ao entrar com Google: ' + err.message);
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
