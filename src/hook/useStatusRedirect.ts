import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface CodigoData {
  status: string;
  campanhaId: string;
  premiado?: boolean;
  premioImagem?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export function useStatusRedirect(codigo: string | null) {
  const router = useRouter();
  const [codigoData, setCodigoData] = useState<CodigoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!codigo) {
      toast.error('Código ausente.');
      router.replace('/sorteio');
      return;
    }

    const validarCodigo = async () => {
      try {
        const q = query(collection(db, 'codigos'), where('codigo', '==', codigo));
        const snap = await getDocs(q);

        if (snap.empty) {
          toast.error('Código inválido.');
          router.replace('/sorteio');
          return;
        }

        const codigoDoc = snap.docs[0];
        const data = codigoDoc.data() as CodigoData;
        setCodigoData(data);

        const redirectUrl = getRedirectUrl(data.status, codigo);
        if (redirectUrl) {
          router.replace(redirectUrl);
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
      } catch (err: any) {
        toast.error('Erro ao validar código.');
        router.replace('/sorteio');
      } finally {
        setLoading(false);
      }
    };

    validarCodigo();
  }, [codigo, router]);

  return { codigoData, loading };
}

function getRedirectUrl(status: string, codigo: string ): string | null {
  const base = '/sorteio';

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
    case 'encerrado':
      toast.error('Este código já foi encerrado.');
      return null;
    default:
      toast.error('Status desconhecido.');
      return null;
  }
}
