export interface Campanha {
  id: string;
  nome: string;
  modo?: 'raspadinha' | 'prazo';
  dataInicio?: Date;
  dataFim?: Date;
  totalRaspadinhas: number;
  raspadinhasRestantes: number;
  premiosTotais: number;
  premiosRestantes: number;
}