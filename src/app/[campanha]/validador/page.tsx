/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Button, Container, FormControl, TextField, Typography } from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
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
  getDoc,
} from 'firebase/firestore';
import { getRedirectUrlByStatus } from '@/utils/redirectByStatus';
import { BaseSorteio } from '@/components/BaseSorteio';
import { verificarEEncerrarCampanha } from '@/lib/campanhaUtils';
;


export default function CodigoPage() {
  const [codigo, setCodigo] = useState('');
  const [campanha, setCampanha] = useState<any | null>(null);

  const router = useRouter();
  const params = useParams();
  const campanhaId = params?.campanha as string;

  // Pega o código da URL (?MXI5VL) e busca campanha
  useEffect(() => {
    const search = window.location.search;

    if (!search.startsWith('?')) {
      toast.error('Código não informado na URL.');
      return;
    }

    const parsedCodigo = search.substring(1).toUpperCase();
    setCodigo(parsedCodigo);
    buscarDados(parsedCodigo);
  }, []);

  const buscarDados = async (codigo: string) => {
    if (!campanhaId) {
      toast.error('Campanha inválida na URL.');
      return;
    }

    try {
      const q = query(collection(db, 'codigos'), where('codigo', '==', codigo));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        toast.error('Código não encontrado');
        return;
      }

      const codeDoc = snapshot.docs[0];
      const data = codeDoc.data();

      if (data.campanhaId !== campanhaId) {
        toast.warning('Código não pertence a essa campanha.');
        return;
      }

      const campanhaSnap = await getDoc(doc(db, 'campanhas', campanhaId));
      if (!campanhaSnap.exists()) {
        toast.error('Campanha não encontrada.');
        return;
      }

      setCampanha(campanhaSnap.data());
    } catch (err: any) {
      toast.error('Erro ao buscar dados: ' + err.message);
    }
  };
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
  console.log('campanha', campanha)
  return (
    <BaseSorteio logoUrl={campanha?.logoUrl}>
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
              disabled={codigo.length < 5}
            >
              Validar
            </Button>
          </FormControl>
        </form>
      </Container>
    </BaseSorteio>
  );
}
