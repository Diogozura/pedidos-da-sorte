'use client';

import { Container } from "@mui/material";

export default function VoucherPage() {
  return (
    <Container maxWidth="md" sx={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <h2>🎉 Seu voucher foi gerado!</h2>
      <p>Use esse voucher na loja ou envie para a equipe.</p>
      <div
        style={{
          marginTop: '20px',
          padding: '20px',
          border: '2px dashed #BA0100',
          background: '#fff',
          color: '#000',
          fontWeight: 'bold',
        }}
      >
        CÓDIGO-VOUCHER-1234
      </div>
    </Container>
  );
}