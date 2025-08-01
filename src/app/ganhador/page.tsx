'use client';

import { useRouter } from 'next/navigation';
import { useFormContext } from '@/config/FormContext';
import { Button, Container, TextField, Typography, Box } from '@mui/material';
import { BaseSorteio } from '@/components/baseSorteio';
import { db } from '@/lib/firebase';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { toast } from 'react-toastify';

export default function GanhadorPage() {
  const router = useRouter();
  const { formValues, setFormValues } = useFormContext();

  const values = formValues['ganhador'] || {};

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues('ganhador', { [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!values.nome || !values.telefone) {
        toast.error('Preencha todos os campos');
        return;
      }

      await addDoc(collection(db, 'cliente_interessados'), {
        nome: values.nome,
        telefone: values.telefone,
        cupom: 'PEDIDO10',
        data: Timestamp.now(),
      });

      toast.success('Dados enviados com sucesso!');
      router.replace('/pagBank');
    } catch (err) {
      console.error('Erro ao salvar dados:', err);
      toast.error('Erro ao enviar dados. Tente novamente.');
    }
  };

  return (
    <BaseSorteio>
      <Container maxWidth="md" sx={{ height: '80vh', display: 'grid', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <Typography component={'h1'} variant="h4" gutterBottom>
          🎉 Parabéns! pelos 10% desconto.
        </Typography>

        <Typography component={'h2'} textAlign={'center'} variant="h4" gutterBottom>
          PEDIDO10
        </Typography>

        <Typography component={'p'} textAlign={'center'} variant="body1" gutterBottom>
          Preencha seus dados para entrar em contato pelo WhatsApp:
        </Typography>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            width: '100%',
            maxWidth: 400,
            mx: 'auto',
            textAlign: 'center',
          }}
        >
          <TextField
            label="Nome completo"
            name="nome"
            fullWidth
            autoComplete="name"
            required
            value={values.nome || ''}
            onChange={handleInputChange}
            sx={{
              input: { color: 'white' },
              label: { color: 'white' },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: 'white' },
                '&:hover fieldset': { borderColor: 'white' },
                '&.Mui-focused fieldset': { borderColor: 'white' },
              },
            }}
          />
          <TextField
            label="Telefone"
            name="telefone"
            fullWidth
            autoComplete="tel"
            required
            value={values.telefone || ''}
            onChange={handleInputChange}
            sx={{
              input: { color: 'white' },
              label: { color: 'white' },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: 'white' },
                '&:hover fieldset': { borderColor: 'white' },
                '&.Mui-focused fieldset': { borderColor: 'white' },
              },
            }}
          />

          <Button type="submit" color="primary" variant="contained">
            Continuar
          </Button>
        </Box>
      </Container>
    </BaseSorteio>
  );
}
