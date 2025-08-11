/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RaspadinhaJogo from '@/components/Raspadinha';
import { toast } from 'react-toastify';
import { Container, Typography } from '@mui/material';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import Link from 'next/link';
import { BaseSorteio } from '@/components/BaseSorteio';


export default function RaspadinhaPage() {
  const router = useRouter();
  const [codigo, setCodigo] = useState<string | null>(null);
  const [finalizado, setFinalizado] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState('/result.png');
  const [codigoDocId, setCodigoDocId] = useState<string | null>(null);
  const [campanhaId, setCampanhaId] = useState<string | null>(null);
  const [premiado, setPremiado] = useState<boolean>(false);
  const [logoCampanha, setLogoCampanha] = useState('');

  const validarCodigo = useCallback(async (code: string) => {
    try {
      const q = query(
        collection(db, 'codigos'),
        where('codigo', '==', code)
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        toast.error('Código inválido');
        router.replace('/sorteio');
        return;
      }

      const docCod = snap.docs[0];
      const dataCod = docCod.data();
      const idCod = docCod.id;
      setCodigoDocId(idCod);
      const campId = dataCod.campanhaId;
      setCampanhaId(campId);

      if (['usado', 'encerrado'].includes(dataCod.status)) {
        toast.error('Este código já foi utilizado.');
        router.replace('/sorteio');
        return;
      }

      if (dataCod.status === 'aguardando raspagem') {
        const prizeName = dataCod.premiado;
        setPremiado(Boolean(prizeName));
        await loadPrize(prizeName, campId);
        return;
      }

      if (dataCod.status !== 'validado') {
        toast.error('Código não está pronto para raspadinha.');
        router.replace('/sorteio');
        return;
      }

      // carrega resultado pré-alocado
      const prizeName: string | null = dataCod.premiado || null;
      setPremiado(Boolean(prizeName));
      await loadPrize(prizeName, campId);

      // marca como aguardando raspagem
      await updateDoc(doc(db, 'codigos', idCod), {
        status: 'aguardando raspagem',
      });
    } catch (err: any) {
      toast.error('Erro na validação: ' + err.message);
    }
  },[router]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('codigo');
    setCodigo(code);

    if (!code) {
      router.replace('/sorteio');
      return;
    }
    validarCodigo(code);
  }, [router, validarCodigo]);



  const loadPrize = async (prizeName: string | null, campId: string) => {
    const campRef = doc(db, 'campanhas', campId);
    const campSnap = await getDoc(campRef);
    const campData = campSnap.data();
      setLogoCampanha(campData?.logoUrl);
    if (!campData) return;
    const prizeObj = campData.premios?.find((p: any) => p.nome === prizeName);
    if (prizeObj) {
      setBackgroundImage(prizeObj.imagem);
    } else {
      setBackgroundImage('/nao-ganhou.png');
    }
  };

  const handleComplete = async () => {
    if (!codigoDocId || !campanhaId) return;
    setFinalizado(true);

    try {
      const refCod = doc(db, 'codigos', codigoDocId);
      const snapCod = await getDoc(refCod);
      const dataCod = snapCod.data();
    
      if (dataCod?.status === 'aguardando raspagem' && dataCod?.premiado !== 'nenhum') {
        await updateDoc(refCod, {
          status: 'aguardando dados ganhador',
          usado: true,
          usadoEm: Timestamp.now(),
        });
        toast.success('🎉 Você ganhou!');
        setTimeout(() => {
          router.replace(
            `/${campanhaId}/ganhador?codigo=${codigo}`
          );
        }, 1500);
      } else {
        await updateDoc(refCod, {
          status: 'encerrado',
          usado: true,
          usadoEm: Timestamp.now(),
        });
        toast.error('Infelizmente você não ganhou desta vez.');
         setTimeout(() => {
          router.replace(
            `/`
          );
        }, 1500);
      }
    } catch (err: any) {
      toast.error('Erro ao finalizar: ' + err.message);
    }
  };
  return (
    <BaseSorteio logoUrl={logoCampanha}>
      <Container
        maxWidth="md"
        sx={{
          textAlign: 'center',
          mt: 4,
          height: '60vh',
          display: 'grid',
          alignContent: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="h4" gutterBottom>
          Raspe para descobrir se ganhou
        </Typography>

        <RaspadinhaJogo
          width={300}
          height={300}
          backgroundImage={backgroundImage}
          onComplete={handleComplete}
        />

        {finalizado && !premiado && (
          <Typography color="#BA0100" mt={2}>
            Infelizmente você não ganhou desta vez. <Link href="/">Voltar ao início</Link>
          </Typography>
        )}
      </Container>
    </BaseSorteio>
  );
}
