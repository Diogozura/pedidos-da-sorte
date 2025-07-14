'use client';

import { useRouter } from 'next/navigation';
import { useFormContext } from '@/config/FormContext';
import { Button, Container, TextField, Typography, Box } from '@mui/material';

export default function GanhadorPage() {
  const router = useRouter();
  const { formValues, setFormValues } = useFormContext();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues('ganhador', { [name]: value });
  };

  const values = formValues['ganhador'] || {};

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aqui você pode enviar para uma API ou salvar local
    router.push('/sorteio/voucher');
  };

  return (
    <Container maxWidth="md" sx={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="h3" component={'h1'} gutterBottom>
        🎉 Parabéns! Preencha seus dados:
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
          value={values.nome || ''}
          onChange={handleInputChange}
        />
        <TextField
          label="Telefone"
          name="telefone"
          fullWidth
          autoComplete="tel"
          value={values.telefone || ''}
          onChange={handleInputChange}
        />
        <TextField
          label="Endereço"
          name="endereco"
          fullWidth
          autoComplete="street-address"
          value={values.endereco || ''}
          onChange={handleInputChange}
        />

        <Button type="submit" color="primary" variant="contained">
          Validar
        </Button>
      </Box>
    </Container>
  );
}
