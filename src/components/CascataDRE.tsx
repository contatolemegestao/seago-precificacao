import React from 'react';
import { ResultadoCalculo } from '../types';
import { brl, nf, pct } from '../lib/calculations';

interface CascataDREProps {
  resultado: ResultadoCalculo;
  aliquota: number;
}

export const CascataDRE: React.FC<CascataDREProps> = ({ resultado, aliquota }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13.5px] border-collapse">
        <tbody>
          <tr className="border-b border-dashed border-[#D2E0E0]">
            <td className="text-left py-3 px-3.5 font-medium text-[#0F262A]">
              Faturamento
              <div className="text-[12px] font-normal text-[#4C666A]">
                {nf(resultado.kgVendido, 1)} kg vendidos × preço de venda de cada lote
              </div>
            </td>
            <td className="text-right py-3 px-3.5 font-mono font-semibold text-[#0F262A]">
              {brl(resultado.faturamento)}
            </td>
          </tr>

          <tr className="border-b border-dashed border-[#D2E0E0]">
            <td className="text-left py-3 px-3.5 font-medium text-[#0F262A]">
              (−) Custo do camarão
              <div className="text-[12px] font-normal text-[#4C666A]">
                {brl(resultado.mpPorKg)}/kg × {nf(resultado.kgComprado, 0)} kg comprados
              </div>
            </td>
            <td className="text-right py-3 px-3.5 font-mono text-[#A9382A]">
              {brl(-resultado.custoMp)}
            </td>
          </tr>

          <tr className="border-b border-dashed border-[#D2E0E0]">
            <td className="text-left py-3 px-3.5 font-medium text-[#0F262A]">
              (−) CIF total
              <div className="text-[12px] font-normal text-[#4C666A]">
                {Object.keys(resultado.porTipo).length} tipos de custo lançados · {brl(resultado.cifPorKgVend)} por kg vendido
              </div>
            </td>
            <td className="text-right py-3 px-3.5 font-mono text-[#A9382A]">
              {brl(-resultado.cifTotal)}
            </td>
          </tr>

          {aliquota > 0 && (
            <tr className="border-b border-dashed border-[#D2E0E0]">
              <td className="text-left py-3 px-3.5 font-medium text-[#0F262A]">
                (−) Imposto
                <div className="text-[12px] font-normal text-[#4C666A]">
                  {pct(aliquota / 100)} sobre o faturamento
                </div>
              </td>
              <td className="text-right py-3 px-3.5 font-mono text-[#A9382A]">
                {brl(-resultado.imposto)}
              </td>
            </tr>
          )}

          <tr className="border-t-2 border-[#B6CBCB] font-bold text-[15px] bg-[#E9F0F0]/50">
            <td className="text-left py-3.5 px-3.5 text-[#0F262A]">
              Lucro operacional
              <div className="text-[12px] font-normal text-[#4C666A]">
                margem de {pct(resultado.margem)}
              </div>
            </td>
            <td className={`text-right py-3.5 px-3.5 font-mono text-[16px] ${resultado.lucroOp >= 0 ? 'text-[#0F7A55]' : 'text-[#A9382A]'}`}>
              {brl(resultado.lucroOp)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
