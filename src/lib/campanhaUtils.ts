import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function verificarEEncerrarCampanha(campanhaId: string) {
  const ref = doc(db, 'campanhas', campanhaId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();

  if (data.raspadinhasRestantes === 0 && data.status !== 'encerrada') {
    await updateDoc(ref, { status: 'encerrada' });
    console.log(`✅ Campanha ${campanhaId} encerrada automaticamente`);
  }
}
