'use client';
import { BaseSorteio } from '@/components/BaseSorteio';
import { useEffect, useState } from 'react';
import { db } from "@/lib/firebase";
import {
  Box,
  Container,
  Typography
} from "@mui/material";
import {
  collection,
  getDocs,
  addDoc,
  query,
  updateDoc,
  where,
  Timestamp,
} from "firebase/firestore";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "react-toastify";


// Função para gerar código aleatório
const gerarCodigoVoucher = (): string => {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let codigo = '';
  for (let i = 0; i < 6; i++) {
    codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return codigo;
};

export default function VoucherPage() {
  const searchParams = useSearchParams();
  const codigo = searchParams.get('codigo');
  const [voucherCode, setVoucherCode] = useState<string | null>(null);
  const campanhaId = searchParams.get('campanhaId') || '';

  // Gera e salva voucher ao montar a página
  useEffect(() => {
    const gerarOuRecuperarVoucher = async () => {
      if (!codigo) return;

      try {
        const q = query(
          collection(db, 'vouchers'),
          where('codigoOriginal', '==', codigo)
        );
        const snap = await getDocs(q);

        if (!snap.empty) {
          // Já existe um voucher criado para esse código
          const voucherExistente = snap.docs[0].data();
          setVoucherCode(voucherExistente.codigoVoucher);
          return;
        }

        // Caso não exista, cria um novo
        const novoCodigo = gerarCodigoVoucher();

        await addDoc(collection(db, 'vouchers'), {
          codigoVoucher: novoCodigo,
          codigoOriginal: codigo,
          criadoEm: Timestamp.now(),
          usado: false,
          status: 'valido',
          campanhaId,
        });

        setVoucherCode(novoCodigo);
      } catch (error) {
        console.error("Erro ao buscar/criar voucher:", error);
        toast.error("Erro ao gerar ou recuperar voucher.");
      }
    };

    gerarOuRecuperarVoucher();
  }, [codigo, campanhaId]);


  const handleCopy = async () => {
    if (!voucherCode) return;

    try {
      await navigator.clipboard.writeText(voucherCode);
      toast.success('Código copiado com sucesso!');

      if (!codigo) {
        toast.error('Código não encontrado na URL.');
        return;
      }

      const q = query(collection(db, 'codigos'), where('codigo', '==', codigo));
      const snap = await getDocs(q);

      if (snap.empty) {
        toast.error('Código não encontrado no banco.');
        return;
      }

      const docRef = snap.docs[0].ref;

      await updateDoc(docRef, {
        status: 'encerrado',
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      toast.error('Erro ao copiar ou atualizar o status.');
    }
  };

  return (
    <BaseSorteio >
      <Container maxWidth="md" sx={{ height: '80vh', display: 'grid', alignContent: 'center', justifyContent: 'center' }}>
        <h2>🎉 Seu voucher foi gerado!</h2>
        <p>Use esse voucher na loja ou envie para a equipe.</p>

        {voucherCode ? (
          <Box
            onClick={handleCopy}
            sx={{
              mt: 2,
              p: 2,
              border: '2px dashed #BA0100',
              backgroundColor: '#fff',
              color: '#000',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            {voucherCode}
          </Box>
        ) : (
          <Typography>Gerando voucher...</Typography>
        )}

        <Typography variant="body1" mt={2}>
          Voltar para o <Link href="/">início</Link>
        </Typography>
      </Container>
    </BaseSorteio>
  );
}
