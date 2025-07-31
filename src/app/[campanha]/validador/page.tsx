/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Button, Container, FormControl, TextField, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  increment,
  doc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { getRedirectUrlByStatus } from '@/utils/redirectByStatus';
import { BaseSorteio } from '@/components/baseSorteio';
import { verificarEEncerrarCampanha } from '@/lib/campanhaUtils';
;


export default function CodigoPage() {
  const [codigo, setCodigo] = useState('');
  const router = useRouter();

  useEffect(() => {
    const search = window.location.search; // ex: "?Q56LSV"
    if (search.startsWith('?') && search.length > 1) {
      const valor = search.substring(1); // remove o "?"
      setCodigo(valor);
    }
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const upperCode = codigo.trim().toUpperCase();

    if (upperCode.length < 5) {
      toast.warning('O código deve ter pelo menos 5 caracteres.');
      return;
    }

    try {
      // Busca o documento de código
      const q = query(
        collection(db, 'codigos'),
        where('codigo', '==', upperCode)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        toast.error('Código inválido ❌');
        return;
      }

      const codeDoc = snapshot.docs[0];
      const data = codeDoc.data();
      const status = data.status;

      // Só processa se estiver ativo
      if (status !== 'ativo') {
        toast.info('Este código já foi validado anteriormente.');
      } else {
        // Atualiza contadores na campanha
        const campanhaRef = doc(db, 'campanhas', data.campanhaId);
        const updates: Record<string, any> = {
          raspadinhasRestantes: increment(-1),
        };
        // Aqui verifica se precisa encerrar
        await verificarEEncerrarCampanha(data.campanhaId);
        // Se tiver prêmio associado, decrementa também
        if (data.premiado && data.premiado !== 'nenhum') {
          updates.premiosRestantes = increment(-1);
        }
        await updateDoc(campanhaRef, updates);

        // Marca código como validado
        await updateDoc(codeDoc.ref, {
          status: 'validado',
          usado: true,
          usadoEm: Timestamp.now(),
        });

        toast.success('Código válido! 🎉');
      }

      // Redireciona conforme status (novo ou existente)
      const nextStatus = status === 'ativo' ? 'validado' : status;
      const redirectUrl = getRedirectUrlByStatus(
        nextStatus,
        upperCode,
        data.campanhaId
      );
      if (redirectUrl) router.push(redirectUrl);
    } catch (err: any) {
      toast.error('Erro ao validar código: ' + err.message);
    }
  };

  return (
    <BaseSorteio>
      <Container
        maxWidth="md"
        sx={{
          height: '70vh',
          display: 'grid',
          alignContent: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          mt: 6,
        }}
      >
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
