import React from 'react';
import { ResultadoCalculo } from '../types';
import { brl0, nf } from '../lib/calculations';

interface CompositionBarProps {
  resultado: ResultadoCalculo;
  aliquota: number;
}

export const CompositionBar: React.FC<CompositionBarProps> = ({ resultado, aliquota }) => {
  const partes = [
    { nome: 'Custo do camarão', val: resultado.custoMp, cor: '#2F62B8' },
    { nome: 'CIF (Logística)', val: resultado.cifTotal, cor: '#C4671C' },
    { nome: 'Lucro operacional', val: resultado.lucroOp, cor: '#0F8A6E' }
  ];

  if (aliquota > 0) {
    partes.splice(2, 0, { nome: 'Imposto', val: resultado.imposto, cor: '#7A9296' });
  }

  const base = partes.reduce((a, p) => a + Math.abs(p.val), 0) || 1;

  const caption = resultado.total
    ? `Para onde vai cada real faturado nas ${resultado.nCargas} cargas — ${brl0(resultado.faturamento)} no total.`
    : `Para onde vai cada real faturado na carga ${resultado.carga} — ${brl0(resultado.faturamento)} no total.`;

  return (
    <figure className="m-0">
      <figcaption className="text-[13px] text-[#4C666A] mb-3">
        {caption}
      </figcaption>

      <div className="flex w-full h-[34px] rounded-md overflow-hidden bg-[#E9F0F0] gap-0.5 shadow-inner">
        {partes.map((p, idx) => {
          const widthPct = (Math.abs(p.val) / base) * 100;
          return (
            <div
              key={idx}
              style={{
                width: `${widthPct}%`,
                backgroundColor: p.cor,
                backgroundImage: p.val < 0 ? 'repeating-linear-gradient(135deg, rgba(255,255,255,.34) 0 4px, transparent 4px 8px)' : undefined
              }}
              className="min-w-[2px] transition-all duration-300 first:rounded-l-md last:rounded-r-md"
              title={`${p.nome}: ${brl0(p.val)} (${nf(widthPct, 1)}%)`}
            />
          );
        })}
      </div>

      <div className="flex gap-5 flex-wrap mt-3.5">
        {partes.map((p, idx) => (
          <div key={idx} className="flex items-baseline gap-2 text-[13px]">
            <span
              className="w-[11px] h-[11px] rounded-[3px] flex-none translate-y-0.5"
              style={{ backgroundColor: p.cor }}
            />
            <span className="text-[#4C666A]">{p.nome}</span>
            <span className="font-semibold font-mono">{brl0(p.val)}</span>
            <span className="text-[#4C666A] font-mono text-xs">
              {nf((Math.abs(p.val) / base) * 100, 1)}%
            </span>
          </div>
        ))}
      </div>
    </figure>
  );
};
