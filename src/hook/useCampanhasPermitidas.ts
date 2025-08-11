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
  empresaId: string; // vamos padronizar esse campo no retorno
}

type UsuarioApp = {
  uid: string;
  nivel: "master" | "admin" | "empresa" | "funcionário";
  pizzariaId?: string; // para funcionário aponta para a empresa
};

export function useCampanhasPermitidas() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [usuario, setUsuario] = useState<UsuarioApp | null>(null);
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
        const userRef = doc(db, "usuarios", user.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();

        if (!userData) {
          setCampanhas([]);
          setLoading(false);
          return;
        }

        const nivel = (userData.nivel ?? "funcionário") as UsuarioApp["nivel"];
        const dadosUsuario: UsuarioApp = {
          uid: user.uid,
          nivel,
          pizzariaId: userData.pizzariaId,
        };
        setUsuario(dadosUsuario);

        const isAdmin = ["admin", "master"].includes(nivel);

        if (isAdmin) {
          // Admin/master vê tudo
          const snap = await getDocs(collection(db, "campanhas"));
          const list = snap.docs.map((d) => ({
            id: d.id,
            nome: d.data().nome,
            status: d.data().status || "ativa",
            // normaliza para empresaId no retorno, olhando ambos os campos
            empresaId: d.data().pizzariaId || d.data().empresaId || "",
          }));
          setCampanhas(list);
          return;
        }

        // Deriva o ownerId por nível
        const ownerId =
          nivel === "empresa"
            ? user.uid
            : dadosUsuario.pizzariaId || ""; // funcionário: precisa ter pizzariaId

        if (!ownerId) {
          setCampanhas([]);
          toast.error("Conta do funcionário sem vínculo de empresa (pizzariaId).");
          return;
        }

        // Compat: busca por pizzariaId (novo) e empresaId (legado), e mescla
        const q1 = query(collection(db, "campanhas"), where("pizzariaId", "==", ownerId));
        const q2 = query(collection(db, "campanhas"), where("empresaId", "==", ownerId));

        const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)]);

        // Mescla sem duplicar
        const byId = new Map<
          string,
          { id: string; nome: string; status: string; empresaId: string }
        >();

        for (const d of [...s1.docs, ...s2.docs]) {
          byId.set(d.id, {
            id: d.id,
            nome: d.data().nome,
            status: d.data().status || "ativa",
            empresaId: d.data().pizzariaId || d.data().empresaId || ownerId,
          });
        }

        setCampanhas([...byId.values()]);
      } catch (err) {
        console.error("Erro ao buscar campanhas:", err);
        toast.error("Erro ao carregar campanhas.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { campanhas, usuario, loading };
}
