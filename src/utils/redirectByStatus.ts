import { toast } from 'react-toastify';

export function getRedirectUrlByStatus(status: string, codigo: string,slug: string): string | null {
  const s = (slug || '').replace(/^\/+|\/+$/g, '');
  // encode só o valor; o '?' fica fora
  const qp = `?codigo=${encodeURIComponent(codigo)}`;

  switch (status) {
    case 'ativo':
    case 'validado':
    case 'aguardando raspagem':
      return `/${s}/raspadinha${qp}`;
    case 'aguardando dados ganhador':
    case 'coleta de dados do ganhador':
      return `/${s}/ganhador${qp}`;
    case 'voucher gerado':
      return `/${s}/voucher${qp}`;
    case 'voucher disponível':
      return `/${s}/voucher${qp}`;
    case 'encerrado':
      toast.error('Este código já foi encerrado.');
      return null;
    default:
      toast.error('Status inválido.');
      return null;
  }
}
