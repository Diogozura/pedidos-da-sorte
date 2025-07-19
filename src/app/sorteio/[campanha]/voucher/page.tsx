'use client';

import { db } from "@/lib/firebase";
import { Box, Container, Typography } from "@mui/material";
import { collection, getDocs, query, updateDoc, where } from "firebase/firestore";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { BaseSorteio } from "../../base";

export default function VoucherPage() {
  const searchParams = useSearchParams();
  const codigo = searchParams.get('codigo');
  const voucherCode = 'CÓDIGO-VOUCHER-1234'; // você pode pegar isso do Firestore se quiser

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(voucherCode);
      toast.success('Código copiado com sucesso!');

      // Atualiza o status no Firestore
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
    <BaseSorteio>

      <Container maxWidth="md" sx={{ height: '80vh', display: 'grid', alignContent: 'center', justifyContent: 'center' }}>
        <h2>🎉 Seu voucher foi gerado!</h2>
        <p>Use esse voucher na loja ou envie para a equipe.</p>
        <Box
          onClick={handleCopy}
          style={{
            marginTop: '20px',
            padding: '20px',
            border: '2px dashed #BA0100',
            background: '#fff',
            color: '#000',
            fontWeight: 'bold',
          }}
        >
          {voucherCode}
        </Box>
        <Typography variant="body1" component={'p'}>Voltar para o <Link href={'/'}>inicio</Link></Typography>
      </Container>
    </BaseSorteio>
  );
}