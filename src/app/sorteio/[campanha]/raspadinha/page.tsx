'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RaspadinhaJogo from '@/components/Raspadinha';
import { toast } from 'react-toastify';
import { Container, Typography } from '@mui/material';
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
import { BaseSorteio } from '../../base';

export default function RaspadinhaPage() {
  const router = useRouter();
  const [codigo, setCodigo] = useState<string | null>(null);
  const [finalizado, setFinalizado] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState('/result.png');
  const [codigoDocId, setCodigoDocId] = useState<string | null>(null);
  const [campanhaId, setCampanhaId] = useState<string | null>(null);
  const [premio, setPremio] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('codigo');
    setCodigo(code);

    if (!code) {
      router.replace('/sorteio');
      return;
    }
    validarCodigo(code);
  }, [router]);

  const validarCodigo = async (code: string) => {
    try {
      // 1) busca o doc de código
      const q = query(collection(db, 'codigos'), where('codigo', '==', code));
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
      setCampanhaId(dataCod.campanhaId);

      // 2) bloqueia se já usado ou encerrado
      if (['usado', 'encerrado'].includes(dataCod.status)) {
        toast.error('Este código já foi utilizado.');
        router.replace('/sorteio');
        return;
      }

      // 3) se já sorteado, apenas carrega o resultado
      if (dataCod.status === 'aguardando raspagem') {
        setPremio(dataCod.premiado);
        setBackgroundImage(dataCod.premioImagem || '/result.png');
        return;
      }

      // 4) só sorteia se for validado
      if (dataCod.status !== 'validado') {
        toast.error('Código não está pronto para raspadinha.');
        router.replace('/sorteio');
        return;
      }

      // 5) busca os dados da campanha
      const refCamp = doc(db, 'campanhas', dataCod.campanhaId);
      const snapCamp = await getDoc(refCamp);
      const camp = snapCamp.data();
      if (!camp) {
        toast.error('Campanha não encontrada.');
        router.replace('/sorteio');
        return;
      }

      // 6) verifica se ainda há prêmios
      let ganhou = false;
      let escolhido: any = null;

      if (camp.premiosRestantes > 0) {
        // filtra apenas prêmios com quantidadeRestantes > 0
        const disponiveis = camp.premios.filter((p: any) => p.quantidadeRestantes > 0);
        if (disponiveis.length) {
          // sorteio ponderado pelo peso (quantidadeRestantes)
          const totalPeso = disponiveis.reduce((sum: number, p: any) => sum + p.quantidadeRestantes, 0);
          const rand = Math.floor(Math.random() * totalPeso);
          let acc = 0;
          for (const p of disponiveis) {
            acc += p.quantidadeRestantes;
            if (rand < acc) {
              escolhido = p;
              break;
            }
          }
        }
      }

      // 7) atualiza Firestore e estado local
      console.log('escolhido', escolhido)
      if (escolhido) {
        ganhou = true;
        setPremio(true);
        setBackgroundImage(escolhido.imagem);

        // decrementa o item escolhido e os contadores gerais
        const novos = camp.premios.map((p: any) =>
          p.nome === escolhido.nome
            ? { ...p, quantidadeRestantes: p.quantidadeRestantes - 1 }
            : p
        );

        await updateDoc(refCamp, {
          premios: novos,
          premiosRestantes: increment(-1),
          raspadinhasRestantes: increment(-1),
        });

        // atualiza o código
        await updateDoc(doc(db, 'codigos', idCod), {
          status: 'aguardando raspagem',
          premiado: true,
          premioNome: escolhido.nome,
          premioImagem: escolhido.imagem,
        });

      } else {
        // sem prêmio (ou sem mais disponíveis)
        setPremio(false);
        setBackgroundImage('/result.png');

        await updateDoc(doc(db, 'codigos', idCod), {
          status: 'aguardando raspagem',
          premiado: false,
          premioNome: '',
          premioImagem: '',
          // se quiser decrementar raspadinhas mesmo sem prêmio, basta descomentar:
          // raspadinhasRestantes: increment(-1),
        });
      }

    } catch (err: any) {
      toast.error('Erro na validação: ' + err.message);
    }
  };

  const handleComplete = async () => {
    if (!codigoDocId || !campanhaId) return;
    setFinalizado(true);

    try {
      const refCod = doc(db, 'codigos', codigoDocId);
      const snapCod = await getDoc(refCod);
      const dataCod = snapCod.data();

      // avança status
      if (dataCod?.status === 'aguardando raspagem' && dataCod?.premiado) {
        await updateDoc(refCod, {
          status: 'aguardando dados ganhador',
          usado: true,
          usadoEm: new Date(),
        });
      } else {
        await updateDoc(refCod, {
          status: 'encerrado',
          usado: true,
          usadoEm: new Date(),
        });
      }

      // feedback e redirecionamento
      if (dataCod?.premiado) {
        toast.success('🎉 Você ganhou!');
        setTimeout(() => {
          router.replace(`/sorteio/${campanhaId}/ganhador?codigo=${codigo}`);
        }, 1500);
      } else {
        toast.error('Infelizmente você não ganhou desta vez.');
      }

    } catch (err: any) {
      toast.error('Erro ao finalizar: ' + err.message);
    }
  };

  return (
    <BaseSorteio>
      <Container
        maxWidth="md"
        sx={{
          textAlign: 'center',
          mt: 4,
          height: '70vh',
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

        {finalizado && !premio && (
          <Typography color="#BA0100" mt={2}>
            Infelizmente você não ganhou desta vez. <Link href="/">Voltar ao início</Link>
          </Typography>
        )}
      </Container>
    </BaseSorteio>
  );
}
