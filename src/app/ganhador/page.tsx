'use client';

import { useRouter } from 'next/navigation';
import { useFormContext } from '@/config/FormContext';
import { Button, Container, TextField, Typography, Box } from '@mui/material';
import { db } from '@/lib/firebase';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { toast } from 'react-toastify';
import dynamic from 'next/dynamic';


const BaseSorteio = dynamic(
  () => import('@/components/BaseSorteio').then(m => m.BaseSorteio),
  {
    ssr: true, // <- mantém render no servidor (evita flash)
    loading: () => (
      <div
        style={{
          minHeight: '100dvh',
          // opcional: cor base enquanto carrega o chunk do componente
          background: '#b30000',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      />
    ),
  }
);

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
      router.replace('https://pag.ae/7_W8tQKKn');
    } catch (err) {
      console.error('Erro ao salvar dados:', err);
      toast.error('Erro ao enviar dados. Tente novamente.');
    }
  };

  return (
    <>
      <BaseSorteio logoUrl="/sua-logo.png">
        <Container maxWidth="md" sx={{ height: '50vh', display: 'grid', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>

          <Typography component={'p'} variant="h5" textAlign={'center'} gutterBottom>
            Preencha os dados abaixo e receba o seu voucher de desconto
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
                input: { color: 'white' }, // texto digitado
                '& .MuiInputLabel-root': { color: 'white' }, // label padrão
                '& .MuiInputLabel-root.Mui-focused': { color: 'white' }, // label focado
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
                input: { color: 'white' }, // texto digitado
                '& .MuiInputLabel-root': { color: 'white' }, // label padrão
                '& .MuiInputLabel-root.Mui-focused': { color: 'white' }, // label focado
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'white' },
                  '&:hover fieldset': { borderColor: 'white' },
                  '&.Mui-focused fieldset': { borderColor: 'white' },
                },
              }}
            />

            <Button type="submit" color="inherit" sx={{
              backgroundColor: '#ffffff',
              color: '#000000',
              '&:hover': {
                backgroundColor: '#f7f7f7b9',
              },
            }} variant="contained">
              Validar meu desconto
            </Button>
          </Box>
        </Container>
      </BaseSorteio>
    </>
  );
}
