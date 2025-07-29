'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useFormContext } from '@/config/FormContext';
import { Button, Container, TextField, Typography, Box } from '@mui/material';
import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { BaseSorteio } from '@/components/baseSorteio';


export default function GanhadorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codigo = searchParams.get('codigo');
  const { formValues, setFormValues } = useFormContext();
  const [loading, setLoading] = useState(false);
  const values = formValues['ganhador'] || {};

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues('ganhador', { [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo) {
      toast.error('Código inválido.');
      return;
    }

    setLoading(true);

    try {
      // Buscar o documento do código
      const q = query(collection(db, 'codigos'), where('codigo', '==', codigo));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        toast.error('Código não encontrado.');
        return;
      }

      const codigoDoc = snapshot.docs[0];
      const codigoId = codigoDoc.id;
      const codigoData = codigoDoc.data();


      // Salvar dados do ganhador
      await addDoc(collection(db, 'ganhadores'), {
        nome: values.nome,
        telefone: values.telefone,
        endereco: values.endereco,
        codigoId,
        campanhaId: codigoData.campanhaId,
        criadoEm: new Date(),
      });

      // Atualizar status do código
      await updateDoc(doc(db, 'codigos', codigoId), {
        status: 'coleta de dados do ganhador',
      });

      toast.success('Dados enviados com sucesso!');
      router.push(`/${codigoData.campanhaId}/voucher?codigo=${codigo}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error('Erro ao salvar dados: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseSorteio>
      <Container maxWidth="md" sx={{ height: '80vh', display: 'grid', alignItems: 'center', justifyContent: 'center' }}>


        <Typography variant="h4" gutterBottom>
          🎉 Parabéns! Preencha seus dados para entrar em contato pelo whatsApp:
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
          />
          <TextField
            label="Telefone"
            name="telefone"
            fullWidth
            autoComplete="tel"
            required
            value={values.telefone || ''}
            onChange={handleInputChange}
          />
          <TextField
            label="Endereço"
            name="endereco"
            fullWidth
            autoComplete="street-address"
            required
            value={values.endereco || ''}
            onChange={handleInputChange}
          />

          <Button type="submit" color="primary" variant="contained" disabled={loading}>
            {loading ? 'Enviando...' : 'Validar'}
          </Button>
        </Box>

      </Container>
    </BaseSorteio>
  );
}
