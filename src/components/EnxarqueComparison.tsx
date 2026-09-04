import React from 'react';
import { ResultadoCalculo, Parametros } from '../types';
import { nf, brl0, brl, pct, getParametrosDaCarga } from '../lib/calculations';

interface EnxarqueComparisonProps {
  resultado: ResultadoCalculo;
  parametros: Parametros;
}

export const EnxarqueComparison: React.FC<EnxarqueComparisonProps> = ({
  resultado,
  parametros,
}) => {
  const onde = resultado.total ? 'nestas cargas' : 'nesta carga';
  const pctEnx = resultado.kgComprado ? resultado.enxPadrao / resultado.kgComprado : 0;
  const semEnx = resultado.lucroOp - resultado.receitaEnx;

  const paramCarga = resultado.carga === 'TOTAL'
    ? { kgCaixa: parametros.kgCaixa || 16, enxarqueKg: parametros.enxarqueKg ?? 1 }
    : getParametrosDaCarga(Number(resultado.carga), parametros);

  return (
    <div className="space-y-4">
      <p className="text-[13.5px] text-[#4C666A]">
        Cada caixa leva <b>{nf(paramCarga.kgCaixa, 0)} kg</b> de camarão e ganha{' '}
        <b>{nf(paramCarga.enxarqueKg, 0)} kg</b> de enxarque no caminho. A quantidade vendida {onde} é a comprada mais esse ganho — <b>{pct(pctEnx)}</b> a mais.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Bloco 1: Cálculo da Quantidade Vendida */}
        <div className="border border-[#0B6E78] rounded-[11px] overflow-hidden bg-white shadow-sm ring-1 ring-[#0B6E78]/30">
          <div className="bg-[#DBEDEE] p-3.5 border-b border-[#0B6E78]/20">
            <span className="inline-block text-[11px] tracking-wider uppercase font-semibold text-[#0B6E78] mb-1">
              Cálculo
            </span>
            <strong className="block text-[14.5px] font-semibold text-[#0F262A]">
              Quantidade vendida
            </strong>
            <small className="block text-[12px] text-[#4C666A] mt-0.5">
              É ela que multiplica o preço de venda no faturamento.
            </small>
          </div>

          <div className="p-3.5 space-y-2.5">
            <div className="flex justify-between items-start pb-2 border-b border-dashed border-[#D2E0E0]">
              <span className="text-[13px] text-[#4C666A] font-medium">
                Quantidade comprada
                <small className="block text-[11.5px] text-[#7A9296] font-normal">
                  o que foi efetivamente pago ao fornecedor
                </small>
              </span>
              <span className="text-[13.5px] font-mono font-semibold text-[#0F262A]">
                {nf(resultado.kgComprado, 0)} kg
              </span>
            </div>

            <div className="flex justify-between items-start pb-2 border-b border-dashed border-[#D2E0E0]">
              <span className="text-[13px] text-[#4C666A] font-medium">
                (÷) Camarão por caixa
                <small className="block text-[11.5px] text-[#7A9296] font-normal">
                  resulta em {nf(resultado.caixas, 1)} caixas
                </small>
              </span>
              <span className="text-[13.5px] font-mono font-semibold text-[#0F262A]">
                {nf(paramCarga.kgCaixa, 0)} kg
              </span>
            </div>

            <div className="flex justify-between items-start pb-2 border-b border-dashed border-[#D2E0E0]">
              <span className="text-[13px] text-[#4C666A] font-medium">
                (+) Enxarque padrão
                <small className="block text-[11.5px] text-[#7A9296] font-normal">
                  {nf(resultado.caixas, 1)} caixas × {nf(paramCarga.enxarqueKg, 0)} kg
                </small>
              </span>
              <span className="text-[13.5px] font-mono font-semibold text-[#0F262A]">
                {nf(resultado.enxPadrao, 1)} kg
              </span>
            </div>

            <div className="flex justify-between items-start pt-2 border-t-2 border-[#B6CBCB]">
              <span className="text-[13.5px] font-semibold text-[#0F262A]">
                Quantidade vendida
                <small className="block text-[11.5px] text-[#7A9296] font-normal">
                  {brl(resultado.precoMedio)} de preço médio
                </small>
              </span>
              <span className="text-[18px] font-mono font-bold text-[#0B6E78]">
                {nf(resultado.kgVendido, 1)} kg
              </span>
            </div>
          </div>
        </div>

        {/* Bloco 2: Conferência com Pesagem Real */}
        <div className="border border-[#D2E0E0] rounded-[11px] overflow-hidden bg-white shadow-sm">
          <div className="bg-[#E9F0F0] p-3.5 border-b border-[#D2E0E0]">
            <span className="inline-block text-[11px] tracking-wider uppercase font-semibold text-[#7A9296] mb-1">
              Conferência
            </span>
            <strong className="block text-[14.5px] font-semibold text-[#0F262A]">
              Padrão × pesagem real
            </strong>
            <small className="block text-[12px] text-[#4C666A] mt-0.5">
              A pesagem final na balança serve para conferir se o padrão de 1 kg/cx se mantém.
            </small>
          </div>

          <div className="p-3.5 space-y-2.5">
            <div className="flex justify-between items-start pb-2 border-b border-dashed border-[#D2E0E0]">
              <span className="text-[13px] text-[#4C666A] font-medium">
                Quantidade final medida
                <small className="block text-[11.5px] text-[#7A9296] font-normal">
                  o que a balança registrou
                </small>
              </span>
              <span className="text-[13.5px] font-mono font-semibold text-[#0F262A]">
                {resultado.kgMedido ? `${nf(resultado.kgMedido, 0)} kg` : '—'}
              </span>
            </div>

            <div className="flex justify-between items-start pb-2 border-b border-dashed border-[#D2E0E0]">
              <span className="text-[13px] text-[#4C666A] font-medium">
                Diferença para o padrão
                <small className="block text-[11.5px] text-[#7A9296] font-normal">
                  {resultado.desvioEnx !== null
                    ? `${pct(Math.abs(resultado.desvioEnx) / Math.max(resultado.kgVendido, 1), 2)} — ${
                        Math.abs(resultado.desvioEnx) / Math.max(resultado.kgVendido, 1) < 0.01
                          ? 'padrão calibrado'
                          : 'revisar enxarque'
                      }`
                    : 'sem pesagem registrada'}
                </small>
              </span>
              <span className="text-[13.5px] font-mono font-semibold text-[#0F262A]">
                {resultado.desvioEnx !== null
                  ? `${resultado.desvioEnx >= 0 ? '+' : ''}${nf(resultado.desvioEnx, 1)} kg`
                  : '—'}
              </span>
            </div>

            <div className="flex justify-between items-start pt-2 border-t-2 border-[#B6CBCB]">
              <span className="text-[13.5px] font-semibold text-[#0F262A]">
                Receita gerada pelo enxarque
                <small className="block text-[11.5px] text-[#7A9296] font-normal">
                  {nf(resultado.enxPadrao, 1)} kg × preço de venda
                </small>
              </span>
              <span className="text-[18px] font-mono font-bold text-[#0F7A55]">
                {brl0(resultado.receitaEnx)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#E9F0F0] border border-[#D2E0E0] rounded-[10px] p-3 text-[13px] text-[#4C666A]">
        Sem o enxarque, o faturamento {onde} seria de{' '}
        <b className="font-mono text-[#0F262A]">
          {brl0(resultado.faturamento - resultado.receitaEnx)}
        </b>{' '}
        e o resultado cairia para{' '}
        <b className={`font-mono ${semEnx >= 0 ? 'text-[#0F7A55]' : 'text-[#A9382A]'}`}>
          {brl0(semEnx)}
        </b>
        . O ganho de peso responde por parcela essencial da margem da operação.
      </div>
    </div>
  );
};
