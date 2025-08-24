import { toast } from 'react-toastify';

export function getRedirectUrlByStatus(status: string, codigo: string,slug: string): string | null {
  const qp = `?codigo=${encodeURIComponent(codigo)}`;

  switch (status) {
    case 'ativo':
    case 'validado':
    case 'aguardando raspagem':
      return `${slug}/raspadinha?${qp}`;
    case 'aguardando dados ganhador':
    case 'coleta de dados do ganhador':
      return `${slug}/ganhador?${qp}`;
    case 'voucher gerado':
      return `${slug}/voucher?${qp}`;
    case 'voucher disponível':
      return `${slug}/voucher?${qp}`;
    case 'encerrado':
      toast.error('Este código já foi encerrado.');
      return null;
    default:
      toast.error('Status inválido.');
      return null;
  }
}
