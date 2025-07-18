'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RaspadinhaJogo from '@/components/Raspadinha';
import { toast } from 'react-toastify';
import { Container } from '@mui/material';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  increment,
  getDoc,
} from 'firebase/firestore';
import Link from 'next/link';

export default function RaspadinhaPage() {
  const router = useRouter();
  const [codigo, setCodigo] = useState<string | null>(null);
  const [finalizado, setFinalizado] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState('/result.png');
  const [codigoDocId, setCodigoDocId] = useState<string | null>(null);
  const [campanhaId, setCampanhaId] = useState<string | null>(null);
  const [premio, setPremio] = useState(false);



  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const codigoURL = searchParams.get('codigo');
    setCodigo(codigoURL);

    if (!codigoURL) {
      router.replace('/sorteio');
      return;
    }

    validarCodigo(codigoURL);
  }, [router]);

  const validarCodigo = async (codigo: string) => {
    try {
      const q = query(collection(db, 'codigos'), where('codigo', '==', codigo));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        toast.error('Código inválido');
        router.replace('/sorteio');
        return;
      }

      const codigoDoc = snapshot.docs[0];
      const data = codigoDoc.data();

      console.log('data.status', data.status)
      console.log('data', data)
      const codigoDocId = codigoDoc.id;
      setCodigoDocId(codigoDocId);
      setCampanhaId(data.campanhaId);

      // Já usado = bloqueia
      if (data.status === 'usado' || data.status === 'encerrado') {
        toast.error('Este código já foi utilizado.');
        router.replace('/sorteio');
        return;
      }

      // Já sorteado = só carrega resultado
      if (data.status === 'aguardando raspagem') {
        toast.info('Esse código já foi sorteado. Raspe para revelar o resultado.');
        setPremio(data.premiado);
        setBackgroundImage(data.premiado ? data.premioImagem || '/logo-pizza.png' : '/result.png');
        return;
      }

      // Status inválido
      if (data.status !== 'validado') {
        toast.error('Código inválido para raspadinha.');
        router.replace('/sorteio');
        return;
      }

      // Caso seja status === validado → sorteia
      const campanhaRef = doc(db, 'campanhas', data.campanhaId);
      const campanhaSnap = await getDoc(campanhaRef);
      const campanhaData = campanhaSnap.data();

      if (!campanhaData) {
        toast.error('Campanha não encontrada.');
        return;
      }


      let sorteado = false;

      if (data.status === 'validado') {
        const chance = campanhaData.premiadasRestantes / campanhaData.raspadinhasRestantes;

        if (campanhaData.premiadasRestantes > 0 && Math.random() < chance) {
          sorteado = true;
          setPremio(true);
          setBackgroundImage(campanhaData.premioImagem || '/logo-pizza.png');
        }

        // Atualiza status para "aguardando raspagem"
        await updateDoc(doc(db, 'codigos', codigoDocId), {
          status: 'aguardando raspagem',
          premiado: sorteado,
          premioImagem: sorteado ? campanhaData.premioImagem || '/logo-pizza.png' : '',
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error('Erro na validação: ' + err.message);
    }
  };


  const handleComplete = async () => {
    if (!codigoDocId || !campanhaId) return;
    setFinalizado(true);

    try {
      const campanhaRef = doc(db, 'campanhas', campanhaId);
      const codigoRef = doc(db, 'codigos', codigoDocId);


      // 🔍 Busca o status atual do código
      const codigoSnap = await getDoc(codigoRef);
      const codigoData = codigoSnap.data();



      if (codigoData?.status === 'aguardando raspagem' && codigoData?.premiado === true) {
        await updateDoc(campanhaRef, {
          premiadasRestantes: increment(-1),
        });
        await updateDoc(codigoRef, {
          usado: true,
          status: 'aguardando dados ganhador',
          usadoEm: new Date(),
        });

      }


      await updateDoc(codigoRef, {
        usado: true,
        status: 'encerrado',
        usadoEm: new Date(),
      });



      if (premio) {
        toast.success('🎉 Você ganhou!');
        setTimeout(() => {
          router.push(`/sorteio/${campanhaId}/ganhador?codigo=${codigo}`);
        }, 2000);
      } else {
        toast.error('Infelizmente você não ganhou desta vez.');
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error('Erro ao finalizar raspadinha: ' + err.message);
    }
  };

  return (
    <Container maxWidth="md" style={{ textAlign: 'center', marginTop: '2rem' }}>
      <h2>Raspe para descobrir se ganhou</h2>

      <RaspadinhaJogo
        width={300}
        height={300}
        backgroundImage={backgroundImage}
        onComplete={handleComplete}
      />

      {finalizado && !premio && (
        <p style={{ textAlign: 'center', marginTop: '1rem', color: '#BA0100' }}>
          Infelizmente você não ganhou desta vez.{' '}
          <Link href="/">Voltar ao início</Link>
        </p>
      )}
    </Container>
  );
}
