// src/hook/useTenantEmpresa.ts
'use client';

import { useUsuarioLogado } from '@/hook/useUsuarioLogado';

type MaybeNivel = string | undefined | null;

function readNivel(
  usuario: unknown,
  perfil: unknown,
  claims: unknown
): MaybeNivel {
  // tenta usuario.nivel
  if (usuario && typeof usuario === 'object' && 'nivel' in usuario) {
    const nv = (usuario as { nivel?: string }).nivel;
    if (typeof nv === 'string') return nv;
  }
  // tenta perfil.nivel
  if (perfil && typeof perfil === 'object' && 'nivel' in perfil) {
    const nv = (perfil as { nivel?: string }).nivel;
    if (typeof nv === 'string') return nv;
  }
  // tenta claims.nivel
  if (claims && typeof claims === 'object' && 'nivel' in claims) {
    const nv = (claims as { nivel?: string }).nivel;
    if (typeof nv === 'string') return nv;
  }
  return null;
}

export interface UseTenantEmpresa {
  loading: boolean;
  isEmpresa: boolean;
  isFuncionario: boolean;
  tenantId: string | null; // uid quando for empresa, pizzariaId quando for funcionário
  nivel: string | null;
}

/**
 * Usa seu hook antigo (useUsuarioLogado) e retorna o tenantId:
 * - Para empresas: retorna seu próprio uid
 * - Para funcionários: retorna o pizzariaId (uid da empresa que trabalham)
 */
export default function useTenantEmpresa(): UseTenantEmpresa {
  const { usuario, carregando } = useUsuarioLogado();
  const perfil = null;
  const claims = null;

  const nivel = readNivel(usuario, perfil, claims);
  const isEmpresa = nivel === 'empresa';
  const isFuncionario = nivel === 'funcionario';

  const uid =
    usuario && typeof usuario === 'object' && 'uid' in usuario
      ? (usuario as { uid: string }).uid
      : null;

  const pizzariaId =
    usuario && typeof usuario === 'object' && 'pizzariaId' in usuario
      ? (usuario as { pizzariaId?: string }).pizzariaId
      : null;

  // Se é empresa, usa seu próprio uid como tenantId
  // Se é funcionário, usa o pizzariaId (que é o uid da empresa)
  const tenantId = isEmpresa ? uid : (isFuncionario ? (pizzariaId ?? null) : null);

  return {
    loading: !!carregando,
    isEmpresa,
    isFuncionario,
    tenantId,
    nivel: nivel ?? null,
  };
}
