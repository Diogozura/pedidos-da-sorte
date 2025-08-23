'use client';

import { useEffect, useState } from 'react';
import { Timestamp, doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type WaStatus =
  | 'desconhecido'
  | 'iniciando'
  | 'aguardando_qr'
  | 'conectando'
  | 'conectado'
  | 'deslogado'
  | 'erro';

export type WaSessionDoc = {
  status: WaStatus;
  phone?: string;
  updatedAt?: Timestamp;
};

export function useWaSession(tenantId?: string) {
  const [session, setSession] = useState<WaSessionDoc | null>(null);
  const [loading, setLoading] = useState<boolean>(!!tenantId);

  useEffect(() => {
    if (!tenantId) {
      setSession(null);
      setLoading(false);
      return;
    }
    const ref = doc(db, 'waSessions', tenantId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setSession(snap.exists() ? (snap.data() as WaSessionDoc) : null);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsub();
  }, [tenantId]);

  return { session, loading, conectado: session?.status === 'conectado' };
}
