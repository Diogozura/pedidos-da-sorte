const RESERVED_SLUGS = new Set([
  'api','auth','dashboard','validador','raspadinha','ganhador','voucher',
  'campanha-info','sitemap.xml','robots.txt','favicon.ico'
]);

export function slugify(input: string): string {
  const base = input
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 60);

  return RESERVED_SLUGS.has(base) ? `${base}-campanha` : base;
}
