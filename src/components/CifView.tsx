import React from 'react';
import { CifLancamento } from '../types';
import { dataLonga, nf, brl, brl0 } from '../lib/calculations';
import { Plus } from 'lucide-react';

interface CifViewProps {
  cif: CifLancamento[];
  onAdicionar: () => void;
  onEditar: (cif: CifLancamento, index: number) => void;
}

export const CifView: React.FC<CifViewProps> = ({ cif, onAdicionar, onEditar }) => {
  // Agrupa os lançamentos por data
  const mapaPorData = new Map<string, { cif: CifLancamento; index: number }[]>();
  cif.forEach((item, idx) => {
    const d = item.data || '';
    if (!mapaPorData.has(d)) mapaPorData.set(d, []);
    mapaPorData.get(d)!.push({ cif: item, index: idx });
  });

  const grupos = Array.from(mapaPorData.entries())
    .sort((a, b) => (b[0] || '0').localeCompare(a[0] || '0'))
    .map(([data, regs]) => ({
      data,
      regs: regs.sort((x, y) => Number(y.cif.carga) - Number(x.cif.carga))
    }));

  return (
    <section className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-end justify-between flex-wrap gap-4 pb-2 border-b border-[#D2E0E0]">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight text-[#0F262A]">
            CIF — Custos Indiretos (Logística e Fretes)
          </h2>
          <p className="text-[13.5px] text-[#4C666A] mt-1 max-w-[650px]">
            Um lançamento por tipo de custo, por carga, agrupado pela data da operação.
          </p>
        </div>
        <button
          type="button"
          onClick={onAdicionar}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0B6E78] hover:bg-[#0B6E78]/90 rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar lançamento</span>
        </button>
      </div>

      <div className="bg-white border border-[#D2E0E0] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px] border-collapse">
            <thead>
              <tr className="bg-white border-b border-[#D2E0E0] text-[11px] uppercase tracking-wider text-[#7A9296]">
                <th className="text-left py-3 px-3.5 font-semibold">Carga</th>
                <th className="text-left py-3 px-3.5 font-semibold">Tipo de Custo</th>
                <th className="text-right py-3 px-3.5 font-semibold">Quantidade / Fator</th>
                <th className="text-right py-3 px-3.5 font-semibold">Valor Unitário / Base</th>
                <th className="text-right py-3 px-3.5 font-semibold">Custo Total</th>
              </tr>
            </thead>
            <tbody>
              {grupos.length > 0 ? (
                grupos.map((g) => {
                  const totalDia = g.regs.reduce(
                    (a, { cif: item }) => a + (Number(item.qtd) || 0) * (Number(item.valor) || 0),
                    0
                  );
                  return (
                    <React.Fragment key={g.data}>
                      <tr className="bg-[#E9F0F0] text-[11px] uppercase font-semibold text-[#4C666A] tracking-wider border-b border-[#D2E0E0]">
                        <td colSpan={5} className="py-2.5 px-3.5">
                          <div className="flex justify-between items-center">
                            <span>{dataLonga(g.data)}</span>
                            <span className="text-[#7A9296] font-medium tracking-normal text-xs">
                              {g.regs.length} lançamento{g.regs.length > 1 ? 's' : ''} · {brl0(totalDia)}
                            </span>
                          </div>
                        </td>
                      </tr>
                      {g.regs.map(({ cif: item, index }) => {
                        const qtd = Number(item.qtd) || 0;
                        const valor = Number(item.valor) || 0;
                        const total = qtd * valor;

                        return (
                          <tr
                            key={index}
                            onClick={() => onEditar(item, index)}
                            className="hover:bg-[#E9F0F0]/60 cursor-pointer border-b border-[#D2E0E0] transition-colors"
                          >
                            <td className="text-left py-3 px-3.5 font-medium">Carga {item.carga}</td>
                            <td className="text-left py-3 px-3.5 font-medium text-[#0F262A]">{item.tipo}</td>
                            <td className="text-right py-3 px-3.5 font-mono">{nf(qtd, 2)}</td>
                            <td className="text-right py-3 px-3.5 font-mono">{nf(valor, 2)}</td>
                            <td className="text-right py-3 px-3.5 font-mono font-semibold text-[#C4671C]">
                              {brl(total)}
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#7A9296] text-sm">
                    Nenhum lançamento cadastrado. Clique em “Adicionar lançamento” para começar.
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
