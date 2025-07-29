import { toast } from 'react-toastify';

export function getRedirectUrlByStatus(status: string, codigo: string,campanhaId: string): string | null {
  const base = `/${campanhaId}`;

  switch (status) {
    case 'ativo':
    case 'validado':
    case 'aguardando raspagem':
      return `${base}/raspadinha?codigo=${codigo}`;
    case 'aguardando dados ganhador':
    case 'coleta de dados do ganhador':
      return `${base}/ganhador?codigo=${codigo}`;
    case 'voucher gerado':
      return `${base}/voucher?codigo=${codigo}`;
    case 'voucher disponível':
      return `${base}/voucher?codigo=${codigo}`;
    case 'encerrado':
      toast.error('Este código já foi encerrado.');
      return null;
    default:
      toast.error('Status inválido.');
      return null;
  }
}
