import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export type NivelPermissao = 'admin' | 'empresa' | 'funcionario';

export interface Usuario {
  uid: string;
  nome: string;
  email: string;
  nivel: NivelPermissao;
  pizzariaId?: string;
}

export function useUsuarioLogado() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUsuario(null);
        setCarregando(false);
        return;
      }

      const docRef = doc(db, 'usuarios', user.uid);
      const snap = await getDoc(docRef);

      if (!snap.exists()) {
        setUsuario(null);
        setCarregando(false);
        return;
      }

      const data = snap.data();
      setUsuario({
        uid: user.uid,
        nome: data.nome,
        email: data.email,
        nivel: data.nivel,
        pizzariaId: data.pizzariaId,
      });
      setCarregando(false);
    });

    return () => unsubscribe();
  }, []);

  return { usuario, carregando };
}
