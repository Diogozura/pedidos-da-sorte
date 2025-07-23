export interface Codigo {
  id: string;
  codigo: string;
  status: string;
  criadoEm: Date;
  usadoEm?: Date;
  premiado?: boolean;
  premio?: string;
  nomeGanhador?: string;
}