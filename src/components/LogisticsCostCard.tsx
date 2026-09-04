import React from 'react';
import { ResultadoCalculo } from '../types';
import { brl, nf } from '../lib/calculations';

interface LogisticsCostCardProps {
  resultado: ResultadoCalculo;
}

export const LogisticsCostCard: React.FC<LogisticsCostCardProps> = ({ resultado }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
      {/* Bloco 1: Custo Real */}
      <div className="border border-[#0B6E78] rounded-[11px] overflow-hidden bg-white shadow-sm ring-1 ring-[#0B6E78]/30">
        <div className="bg-[#DBEDEE] p-3.5 border-b border-[#0B6E78]/20">
          <span className="inline-block text-[11px] tracking-wider uppercase font-semibold text-[#0B6E78] mb-1">
            Custo
          </span>
          <strong className="block text-[14.5px] font-semibold text-[#0F262A]">
            CIF por kg vendido
          </strong>
          <small className="block text-[12px] text-[#4C666A] mt-0.5">
            Quanto de frete cada quilo vendido carrega. É o CIF integral que entra no resultado da operação.
          </small>
        </div>

        <div className="p-3.5 space-y-2.5">
          <div className="flex justify-between items-start pb-2 border-b border-dashed border-[#D2E0E0]">
            <span className="text-[13px] text-[#4C666A] font-medium">
              Gasto total de frete (CIF)
              <small className="block text-[11.5px] text-[#7A9296] font-normal">
                {Object.keys(resultado.porTipo).length} tipos de custo lançados
              </small>
            </span>
            <span className="text-[13.5px] font-mono font-semibold text-[#0F262A]">
              {brl(resultado.cifTotal)}
            </span>
          </div>

          <div className="flex justify-between items-start pb-2 border-b border-dashed border-[#D2E0E0]">
            <span className="text-[13px] text-[#4C666A] font-medium">
              (÷) Quantidade vendida
              <small className="block text-[11.5px] text-[#7A9296] font-normal">
                {nf(resultado.kgComprado, 0)} kg comprados + {nf(resultado.enxPadrao, 1)} kg de enxarque
              </small>
            </span>
            <span className="text-[13.5px] font-mono font-semibold text-[#0F262A]">
              {nf(resultado.kgVendido, 1)} kg
            </span>
          </div>

          <div className="flex justify-between items-start pt-2 border-t-2 border-[#B6CBCB]">
            <span className="text-[13.5px] font-semibold text-[#0F262A]">
              CIF por kg
              <small className="block text-[11.5px] text-[#7A9296] font-normal">
                sobre a quantidade vendida
              </small>
            </span>
            <span className="text-[18px] font-mono font-bold text-[#0B6E78]">
              {brl(resultado.cifPorKgVend)}
            </span>
          </div>
        </div>
      </div>

      {/* Bloco 2: Indicador Líquido */}
      <div className="border border-[#D2E0E0] rounded-[11px] overflow-hidden bg-white shadow-sm">
        <div className="bg-[#E9F0F0] p-3.5 border-b border-[#D2E0E0]">
          <span className="inline-block text-[11px] tracking-wider uppercase font-semibold text-[#7A9296] mb-1">
            Indicador
          </span>
          <strong className="block text-[14.5px] font-semibold text-[#0F262A]">
            Custo logístico líquido
          </strong>
          <small className="block text-[12px] text-[#4C666A] mt-0.5">
            Mostra o quanto o enxarque cobre do frete. Serve para acompanhar a eficiência — não altera o DRE.
          </small>
        </div>

        <div className="p-3.5 space-y-2.5">
          <div className="flex justify-between items-start pb-2 border-b border-dashed border-[#D2E0E0]">
            <span className="text-[13px] text-[#4C666A] font-medium">
              Gasto total de frete (CIF)
              <small className="block text-[11.5px] text-[#7A9296] font-normal">
                o que a logística custou
              </small>
            </span>
            <span className="text-[13.5px] font-mono font-semibold text-[#0F262A]">
              {brl(resultado.cifTotal)}
            </span>
          </div>

          <div className="flex justify-between items-start pb-2 border-b border-dashed border-[#D2E0E0]">
            <span className="text-[13px] text-[#4C666A] font-medium">
              (−) Receita do enxarque
              <small className="block text-[11.5px] text-[#7A9296] font-normal">
                {nf(resultado.enxPadrao, 1)} kg × preço de venda
              </small>
            </span>
            <span className="text-[13.5px] font-mono text-[#A9382A]">
              {brl(-resultado.receitaEnx)}
            </span>
          </div>

          <div className="flex justify-between items-start pt-2 border-t-2 border-[#B6CBCB]">
            <span className="text-[13.5px] font-semibold text-[#0F262A]">
              Líquido por kg
              <small className="block text-[11.5px] text-[#7A9296] font-normal">
                {brl(resultado.cifLiquido)} ÷ {nf(resultado.kgVendido, 1)} kg
              </small>
            </span>
            <span className="text-[18px] font-mono font-bold text-[#0F262A]">
              {brl(resultado.logPorKg)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
