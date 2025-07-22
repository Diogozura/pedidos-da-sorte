'use client';

import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { CircularProgress, Container, Typography } from '@mui/material';
import { NivelPermissao, useUsuarioLogado } from '@/hook/useUsuarioLogado';

interface Props {
  permitido: NivelPermissao[];
  children: ReactNode;
}

export default function ProtegePagina({ permitido, children }: Props) {
  const { usuario, carregando } = useUsuarioLogado();
  const router = useRouter();

  useEffect(() => {
    if (!carregando && (!usuario || !permitido.includes(usuario.nivel))) {
      router.replace('/dashboard'); // redireciona se não tiver permissão
    }
  }, [usuario, carregando, permitido, router]);

  if (carregando || !usuario) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography>Verificando acesso...</Typography>
      </Container>
    );
  }

  // Se tiver permissão, renderiza a página normalmente
  return <>{children}</>;
}
