import React from 'react';
import { Lote, Parametros } from '../types';
import { dataLonga, nf, brl0 } from '../lib/calculations';
import { Plus } from 'lucide-react';

interface MateriaPrimaViewProps {
  lotes: Lote[];
  parametros: Parametros;
  onAdicionar: () => void;
  onEditar: (lote: Lote, index: number) => void;
}

export const MateriaPrimaView: React.FC<MateriaPrimaViewProps> = ({
  lotes,
  parametros,
  onAdicionar,
  onEditar
}) => {
  // Agrupa os lotes por data
  const mapaPorData = new Map<string, { lote: Lote; index: number }[]>();
  lotes.forEach((lote, idx) => {
    const d = lote.data || '';
    if (!mapaPorData.has(d)) mapaPorData.set(d, []);
    mapaPorData.get(d)!.push({ lote, index: idx });
  });

  const grupos = Array.from(mapaPorData.entries())
    .sort((a, b) => (b[0] || '0').localeCompare(a[0] || '0'))
    .map(([data, regs]) => ({
      data,
      regs: regs.sort((x, y) => Number(y.lote.carga) - Number(x.lote.carga) || Number(x.lote.lote) - Number(y.lote.lote))
    }));

  const kgCaixa = parametros.kgCaixa || 16;
  const enxKg = parametros.enxarqueKg ?? 1;

  return (
    <section className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-end justify-between flex-wrap gap-4 pb-2 border-b border-[#D2E0E0]">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight text-[#0F262A]">
            Matéria-prima (Camarão)
          </h2>
          <p className="text-[13.5px] text-[#4C666A] mt-1 max-w-[650px]">
            Custo direto. Um registro por lote de camarão comprado, agrupado pela data da operação.
          </p>
        </div>
        <button
          type="button"
          onClick={onAdicionar}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0B6E78] hover:bg-[#0B6E78]/90 rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar lote</span>
        </button>
      </div>

      <div className="bg-white border border-[#D2E0E0] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px] border-collapse">
            <thead>
              <tr className="bg-white border-b border-[#D2E0E0] text-[11px] uppercase tracking-wider text-[#7A9296]">
                <th className="text-left py-3 px-3.5 font-semibold">Carga</th>
                <th className="text-left py-3 px-3.5 font-semibold">Lote</th>
                <th className="text-left py-3 px-3.5 font-semibold">Fornecedor</th>
                <th className="text-left py-3 px-3.5 font-semibold">Classificação</th>
                <th className="text-right py-3 px-3.5 font-semibold">Compra R$/kg</th>
                <th className="text-right py-3 px-3.5 font-semibold">Qtd Comprada</th>
                <th className="text-right py-3 px-3.5 font-semibold">Qtd Vendida</th>
                <th className="text-right py-3 px-3.5 font-semibold">Venda R$/kg</th>
                <th className="text-right py-3 px-3.5 font-semibold">Custo Total</th>
              </tr>
            </thead>
            <tbody>
              {grupos.length > 0 ? (
                grupos.map((g) => {
                  const totalDia = g.regs.reduce(
                    (a, { lote }) => a + (Number(lote.valor_compra_kg) || 0) * (Number(lote.qtd_comprada) || 0),
                    0
                  );
                  return (
                    <React.Fragment key={g.data}>
                      <tr className="bg-[#E9F0F0] text-[11px] uppercase font-semibold text-[#4C666A] tracking-wider border-b border-[#D2E0E0]">
                        <td colSpan={9} className="py-2.5 px-3.5">
                          <div className="flex justify-between items-center">
                            <span>{dataLonga(g.data)}</span>
                            <span className="text-[#7A9296] font-medium tracking-normal text-xs">
                              {g.regs.length} lote{g.regs.length > 1 ? 's' : ''} · {brl0(totalDia)}
                            </span>
                          </div>
                        </td>
                      </tr>
                      {g.regs.map(({ lote, index }) => {
                        const qc = Number(lote.qtd_comprada) || 0;
                        const pc = Number(lote.valor_compra_kg) || 0;
                        const custo = pc * qc;
                        const caixas = kgCaixa > 0 ? qc / kgCaixa : 0;
                        const qVend = qc + caixas * enxKg;

                        return (
                          <tr
                            key={index}
                            onClick={() => onEditar(lote, index)}
                            className="hover:bg-[#E9F0F0]/60 cursor-pointer border-b border-[#D2E0E0] transition-colors"
                          >
                            <td className="text-left py-3 px-3.5 font-medium">Carga {lote.carga}</td>
                            <td className="text-left py-3 px-3.5">{lote.lote}</td>
                            <td className="text-left py-3 px-3.5 text-[#0F262A]">{lote.fornecedor || '—'}</td>
                            <td className="text-left py-3 px-3.5 font-medium">{lote.classificacao || '—'}</td>
                            <td className="text-right py-3 px-3.5 font-mono">{nf(pc)}</td>
                            <td className="text-right py-3 px-3.5 font-mono">{nf(qc, 0)} kg</td>
                            <td className="text-right py-3 px-3.5 font-mono font-semibold text-[#0B6E78]">
                              {nf(qVend, 1)} kg
                            </td>
                            <td className="text-right py-3 px-3.5 font-mono">{nf(Number(lote.valor_venda_kg))}</td>
                            <td className="text-right py-3 px-3.5 font-mono font-semibold">
                              {brl0(custo)}
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#7A9296] text-sm">
                    Nenhum lote cadastrado. Clique em “Adicionar lote” para começar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
