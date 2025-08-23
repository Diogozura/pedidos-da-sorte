'use client';
import { useEffect, useState } from 'react';
import { CampaignTheme, loadCampaignTheme, saveCampaignTheme } from '@/utils/campaignTheme';

export function useCampaignTheme(campanhaId?: string) {
  const [theme, setTheme] = useState<CampaignTheme>({});

  useEffect(() => {
    if (!campanhaId) return;

    // 1) tenta do storage
    const cached = loadCampaignTheme(campanhaId);
    if (cached) setTheme(cached);

    // 2) garante do servidor (idempotente)
    (async () => {
      try {
        const res = await fetch('/api/sorteio/campanha-info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campanhaId }),
        });
        const json = await res.json();
        if (res.ok && json?.campanha) {
          const t = {
            logoUrl: json.campanha.logoUrl ?? null,
            backgroundColor: json.campanha.backgroundColor ?? json.campanha.corFundo ?? null,
            textColor: json.campanha.textColor ?? null,
          } as CampaignTheme;

          setTheme((prev) => ({ ...prev, ...t }));
          saveCampaignTheme(campanhaId, { ...cached, ...t });
        }
      } catch { /* silencioso */ }
    })();
  }, [campanhaId]);

  return theme;
}
