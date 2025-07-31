'use client';

import { useRouter } from 'next/navigation';
import { useFormContext } from '@/config/FormContext';
import { Button, Container, TextField, Typography, Box } from '@mui/material';

import { BaseSorteio } from '@/components/baseSorteio';


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

    router.replace('/pagBank');

  };

  return (
    <BaseSorteio>
      <Container maxWidth="md" sx={{ height: '80vh', display: 'grid', alignItems: 'center', justifyContent: 'center' }}>


        <Typography component={'h1'} variant="h4" gutterBottom>
          🎉 Parabéns! pelos 10% desconto.
        </Typography>
        <Typography component={'p'} textAlign={'center'} variant="body1" gutterBottom>
          Preencha seus dados para entrar em contato pelo whatsApp:
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

          <Button type="submit" color="primary" variant="contained" >
            continuar
          </Button>
        </Box>

      </Container>
    </BaseSorteio>
  );
}
