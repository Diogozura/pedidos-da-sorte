'use client';

import {
  Button,
  Container,
  FormControl,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  increment,
} from 'firebase/firestore';
import { doc, updateDoc } from 'firebase/firestore';
import { getRedirectUrlByStatus } from '@/utils/redirectByStatus';
import { BaseSorteio } from './base';


export default function CodigoPage() {
  const [codigo, setCodigo] = useState('');
  const router = useRouter();


  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const upperCode = codigo.trim().toUpperCase();

    if (upperCode.length < 5) {
      toast.warning('O código deve ter pelo menos 5 caracteres.');
      return;
    }

    try {
      const q = query(
        collection(db, 'codigos'),
        where('codigo', '==', upperCode)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        toast.error('Código inválido ❌');
        return;
      }

      const docRef = snapshot.docs[0].ref;
      const data = snapshot.docs[0].data();
      const status = data.status;
      console.log('data', data)
      if (status === 'ativo') {
        const campanhaRef = doc(db, 'campanhas', data.campanhaId);
        await updateDoc(campanhaRef, {
          raspadinhasRestantes: increment(-1),
        });

        await updateDoc(docRef, {
          status: 'validado',
          usado: true,
          usadoEm: new Date(),
        });

        toast.success('Código válido! 🎉');
      }

      // ✅ Redireciona com base no status (atualizado ou original)
      const redirectUrl = getRedirectUrlByStatus(
        status === 'ativo' ? 'validado' : status,
        upperCode,
        data.campanhaId
      );

      if (redirectUrl) {
        router.push(redirectUrl);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error('Erro ao validar código: ' + err.message);
    }
  };



  return (
    <BaseSorteio>

      <Container maxWidth="md" sx={{ height: '70vh', display: 'grid', alignContent: 'center', justifyContent: 'center', textAlign: 'center', mt: 6 }}>
        <Typography variant="h4" component="h1">
          Digite seu código de sorteio
        </Typography>

        <form onSubmit={handleSubmit}>
          <FormControl fullWidth sx={{ mt: 4 }}>
            <TextField
              value={codigo}
              label="Código"
              placeholder="EX: ABC123"
              required
              inputProps={{ minLength: 5 }}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            />
            <Button
              type="submit"
              color="primary"
              variant="contained"
              sx={{ mt: 2 }}
              disabled={codigo.trim().length < 5}
            >
              Validar
            </Button>
          </FormControl>
        </form>
      </Container>
    </BaseSorteio>
  );
}
