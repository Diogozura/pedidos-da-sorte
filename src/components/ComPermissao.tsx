// components/ComPermissao.tsx
import { NivelPermissao, useUsuarioLogado } from '@/hook/useUsuarioLogado';
import { ReactNode } from 'react';


interface ComPermissaoProps {
  permitido: NivelPermissao[];
  children: ReactNode;
}

export default function ComPermissao({ permitido, children }: ComPermissaoProps) {
  const { usuario, carregando } = useUsuarioLogado();

  if (carregando) return null;
  if (!usuario || !permitido.includes(usuario.nivel)) return null;

  return <>{children}</>;
}
