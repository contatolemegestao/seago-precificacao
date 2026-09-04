export interface Carga {
  id?: string;
  numero: number;
  data_operacao?: string;
  status?: string;
  observacoes?: string;
}

export interface Lote {
  id?: string;
  carga_id?: string;
  carga: number;
  lote: number;
  data: string;
  fornecedor: string;
  classificacao: string;
  gr_inicial?: number | null;
  gr_final?: number | null;
  valor_compra_kg: number;
  qtd_comprada: number;
  qtd_final?: number | null; // Pesagem de conferência
  valor_venda_kg: number;
}

export interface CifLancamento {
  id?: string;
  carga_id?: string;
  carga: number;
  data: string;
  tipo: string;
  qtd: number;
  valor: number;
}

export interface ParametroCargaItem {
  kgCaixa: number;
  enxarqueKg: number;
}

export interface Parametros {
  id?: string;
  kgCaixa: number;
  enxarqueKg: number;
  porCarga?: Record<number, ParametroCargaItem>;
  atualizadoEm?: string;
}

export interface LoteCalculado extends Lote {
  qc: number;
  qm: number;
  pv: number;
  pc: number;
  caixas: number;
  enxPadrao: number;
  qVend: number;
  custoMp: number;
  faturamento: number;
  receitaEnx: number;
  desvio: number | null;
  pctEnxMedido: number | null;
}

export interface ResultadoCalculo {
  carga: number | 'TOTAL';
  total: boolean;
  nCargas: number;
  lotes: LoteCalculado[];
  porTipo: Record<string, number>;
  cifTotal: number;
  cifLiquido: number;
  custoMp: number;
  caixas: number;
  enxPadrao: number;
  receitaEnx: number;
  kgComprado: number;
  kgVendido: number;
  kgMedido: number;
  faturamento: number;
  lucroOp: number;
  investido: number;
  cifPorKg: number;
  cifPorKgVend: number;
  logPorKg: number;
  mpPorKg: number;
  custoPorKg: number; // Agora calculado sobre o KG Vendido
  precoMedio: number;
  margem: number;
  lucroKg: number;
  roi: number;
  desvioEnx: number | null;
  completa: boolean;
}
