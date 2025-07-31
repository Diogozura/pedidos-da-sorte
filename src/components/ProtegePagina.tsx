'use client';

import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { NivelPermissao, useUsuarioLogado } from '@/hook/useUsuarioLogado';
import LoadingOverlay from './LoadingOverlay';

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
        <LoadingOverlay texto="Verificando acesso..." />
    );
  }

  // Se tiver permissão, renderiza a página normalmente
  return <>{children}</>;
}
