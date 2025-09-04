export type CampaignTheme = {
  logoUrl?: string | null;
  backgroundColor?: string | null;
  textColor?: string | null;
};

const KEY = (id: string) => `campaignTheme:${id}`;

export function saveCampaignTheme(campanhaId: string, theme: CampaignTheme) {
  try {
    sessionStorage.setItem(KEY(campanhaId), JSON.stringify(theme));
  } catch { /* ignore */ }
}

export function loadCampaignTheme(campanhaId: string): CampaignTheme | null {
  try {
    const raw = sessionStorage.getItem(KEY(campanhaId));
    return raw ? (JSON.parse(raw) as CampaignTheme) : null;
  } catch {
    return null;
  }
  
}
