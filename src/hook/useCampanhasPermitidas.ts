import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "react-toastify";

export interface Campanha {
  id: string;
  nome: string;
  status: string;
  empresaId: string;
}

export function useCampanhasPermitidas() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [usuario, setUsuario] = useState<{
    uid: string;
    nivel: string;
    pizzariaId?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (!user) {
      setCampanhas([]);
      setUsuario(null);
      setLoading(false);
      return;
    }

    try {
      const userRef = doc(db, 'usuarios', user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();

      if (!userData) {
        setCampanhas([]);
        setLoading(false);
        return;
      }

      setUsuario({
        uid: user.uid,
        nivel: userData.nivel,
        pizzariaId: userData.pizzariaId,
      });

      const isAdmin = ['admin', 'master'].includes(userData.nivel);

      let snap;
      if (isAdmin) {
        snap = await getDocs(collection(db, 'campanhas'));
      } else {
        const q = query(collection(db, 'campanhas'), where('empresaId', '==', userData.pizzariaId));
        snap = await getDocs(q);
      }

      const list = snap.docs.map(doc => ({
        id: doc.id,
        nome: doc.data().nome,
        status: doc.data().status || 'ativa',
        empresaId: doc.data().empresaId || '',
      }));

      setCampanhas(list);
    } catch (err) {
      console.error('Erro ao buscar campanhas:', err);
      toast .error('Erro ao carregar campanhas.');
    } finally {
      setLoading(false); // garante que vai sair do loading
    }
  });

  return () => unsubscribe(); // cleanup
}, []);


  return { campanhas, usuario, loading };
}
