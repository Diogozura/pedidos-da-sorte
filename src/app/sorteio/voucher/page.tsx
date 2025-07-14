'use client';

import { Box, Container, Typography } from "@mui/material";
import Link from "next/link";
import { toast } from "react-toastify";

export default function VoucherPage() {
  const voucherCode = 'CÓDIGO-VOUCHER-1234';

  const handleCopy = () => {
    navigator.clipboard.writeText(voucherCode)
      .then(() => toast.success('Código copiado com sucesso!'))
      .catch(() => toast.error('Erro ao copiar o código.'));

  }
    return (
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
    );
  }