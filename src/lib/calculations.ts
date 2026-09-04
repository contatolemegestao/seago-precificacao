import { Lote, CifLancamento, Parametros, ResultadoCalculo, LoteCalculado, ParametroCargaItem } from '../types';

export const nf = (n: number | null | undefined, d = 2): string => {
  const val = typeof n === 'number' && isFinite(n) ? n : 0;
  return val.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
};

export const brl = (n: number | null | undefined): string => 'R$ ' + nf(n, 2);
export const brl0 = (n: number | null | undefined): string => 'R$ ' + nf(n, 0);
export const pct = (n: number | null | undefined, d = 1): string => nf((n || 0) * 100, d) + '%';
export const kg = (n: number | null | undefined): string => nf(n, 0) + ' kg';

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

export function dataLonga(iso?: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return 'Sem data definida';
  const [a, m, d] = iso.split('-').map(Number);
  return `${d} de ${MESES[m - 1]} de ${a}`;
}

export const hoje = (): string => new Date().toISOString().slice(0, 10);

export function getCargas(lotes: Lote[], cif: CifLancamento[]): number[] {
  const set = new Set<number>([
    ...lotes.map(l => Number(l.carga)),
    ...cif.map(c => Number(c.carga))
  ]);
  return Array.from(set).filter(n => !isNaN(n)).sort((a, b) => a - b);
}

export function getCargasCompletas(lotes: Lote[], cif: CifLancamento[]): number[] {
  return getCargas(lotes, cif).filter(c => lotes.some(l => Number(l.carga) === c));
}

export function getCargasIncompletas(lotes: Lote[], cif: CifLancamento[]): number[] {
  return getCargas(lotes, cif).filter(c => !lotes.some(l => Number(l.carga) === c));
}

export function getParametrosDaCarga(cargaNum: number, parametros: Parametros): ParametroCargaItem {
  if (parametros.porCarga && parametros.porCarga[cargaNum]) {
    return {
      kgCaixa: Number(parametros.porCarga[cargaNum].kgCaixa) || 16,
      enxarqueKg: parametros.porCarga[cargaNum].enxarqueKg ?? 1
    };
  }
  return {
    kgCaixa: Number(parametros.kgCaixa) || 16,
    enxarqueKg: parametros.enxarqueKg ?? 1
  };
}

export function calcularResultado(
  carga: number | 'TOTAL',
  lotesTotal: Lote[],
  cifTotal: CifLancamento[],
  parametros: Parametros
): ResultadoCalculo {
  const isTotal = carga === 'TOTAL';
  const cargasAlvo = new Set<number>(
    isTotal ? getCargasCompletas(lotesTotal, cifTotal) : [Number(carga)]
  );

  const lotesFiltrados: LoteCalculado[] = lotesTotal
    .filter(x => cargasAlvo.has(Number(x.carga)))
    .map(l => {
      const paramCarga = getParametrosDaCarga(Number(l.carga), parametros);
      const kgCaixa = paramCarga.kgCaixa;
      const enxKg = paramCarga.enxarqueKg;

      const qc = Number(l.qtd_comprada) || 0;
      const qm = Number(l.qtd_final) || 0;
      const pv = Number(l.valor_venda_kg) || 0;
      const pc = Number(l.valor_compra_kg) || 0;
      const caixas = kgCaixa > 0 ? qc / kgCaixa : 0;
      const enxPadrao = caixas * enxKg;
      const qVend = qc + enxPadrao;
      return {
        ...l,
        qc,
        qm,
        pv,
        pc,
        caixas,
        enxPadrao,
        qVend,
        custoMp: pc * qc,
        faturamento: pv * qVend,
        receitaEnx: pv * enxPadrao,
        desvio: qm ? qm - qVend : null,
        pctEnxMedido: qm && qc ? qm / qc - 1 : null,
      };
    });

  const custoMp = lotesFiltrados.reduce((a, b) => a + b.custoMp, 0);
  const kgComprado = lotesFiltrados.reduce((a, b) => a + b.qc, 0);
  const kgVendido = lotesFiltrados.reduce((a, b) => a + b.qVend, 0);
  const kgMedido = lotesFiltrados.reduce((a, b) => a + b.qm, 0);
  const enxPadrao = lotesFiltrados.reduce((a, b) => a + b.enxPadrao, 0);
  const caixas = lotesFiltrados.reduce((a, b) => a + b.caixas, 0);
  const faturamento = lotesFiltrados.reduce((a, b) => a + b.faturamento, 0);
  const receitaEnx = lotesFiltrados.reduce((a, b) => a + b.receitaEnx, 0);

  const porTipo: Record<string, number> = {};
  cifTotal
    .filter(c => cargasAlvo.has(Number(c.carga)))
    .forEach(c => {
      const totalItem = (Number(c.qtd) || 0) * (Number(c.valor) || 0);
      porTipo[c.tipo] = (porTipo[c.tipo] || 0) + totalItem;
    });

  const totalCif = Object.values(porTipo).reduce((a, b) => a + b, 0);
  const cifLiquido = totalCif - receitaEnx;
  const logPorKg = kgVendido ? cifLiquido / kgVendido : 0;

  // Sem incidência de imposto
  const lucroOp = faturamento - custoMp - totalCif;
  const investido = custoMp + totalCif;

  return {
    carga,
    total: isTotal,
    nCargas: cargasAlvo.size,
    lotes: lotesFiltrados,
    porTipo,
    cifTotal: totalCif,
    cifLiquido,
    custoMp,
    caixas,
    enxPadrao,
    receitaEnx,
    kgComprado,
    kgVendido,
    kgMedido,
    faturamento,
    lucroOp,
    investido,
    cifPorKg: kgComprado ? totalCif / kgComprado : 0,
    cifPorKgVend: kgVendido ? totalCif / kgVendido : 0,
    logPorKg,
    mpPorKg: kgComprado ? custoMp / kgComprado : 0,
    custoPorKg: kgVendido ? investido / kgVendido : 0, // Custo R$/kg agora sobre o KG VENDIDO
    precoMedio: kgVendido ? faturamento / kgVendido : 0,
    margem: faturamento ? lucroOp / faturamento : 0,
    lucroKg: kgVendido ? lucroOp / kgVendido : 0,
    roi: investido ? lucroOp / investido : 0,
    desvioEnx: kgMedido ? kgMedido - kgVendido : null,
    completa: lotesFiltrados.length > 0,
  };
}
