import React, { useState } from 'react';
import { Lote, CifLancamento, Parametros } from '../types';
import {
  calcularResultado,
  getCargas,
  getCargasCompletas,
  getCargasIncompletas,
  brl,
  brl0,
  nf,
  pct
} from '../lib/calculations';
import { TIPOS_CIF } from '../lib/mockData';
import { KpiCard } from './KpiCard';
import { CompositionBar } from './CompositionBar';
import { CascataDRE } from './CascataDRE';
import { EnxarqueComparison } from './EnxarqueComparison';
import { LogisticsCostCard } from './LogisticsCostCard';
import { AlertTriangle, Info } from 'lucide-react';

interface RevisaoViewProps {
  lotes: Lote[];
  cif: CifLancamento[];
  parametros: Parametros;
  cargaSelecionada: number | 'TOTAL';
  setCargaSelecionada: (carga: number | 'TOTAL') => void;
}

export const RevisaoView: React.FC<RevisaoViewProps> = ({
  lotes,
  cif,
  parametros,
  cargaSelecionada,
  setCargaSelecionada
}) => {
  const [mostrarTodosCif, setMostrarTodosCif] = useState(false);

  const todasCargas = getCargas(lotes, cif);
  const cargasCompletas = getCargasCompletas(lotes, cif);
  const cargasIncompletas = getCargasIncompletas(lotes, cif);

  const r = calcularResultado(cargaSelecionada, lotes, cif, parametros);

  return (
    <section className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-end justify-between flex-wrap gap-4 pb-2 border-b border-[#D2E0E0]">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight text-[#0F262A]">
            Resultado Operacional
          </h2>
          <p className="text-[13.5px] text-[#4C666A] mt-1 max-w-[650px]">
            Precificação e lucro por carga. Escolha uma carga específica ou visualize o acumulado de todas.
          </p>
        </div>
      </div>

      {/* Seletor de Cargas (Chips) */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="text-[11.5px] uppercase tracking-wider font-semibold text-[#7A9296]">
          Ver:
        </span>
        <button
          type="button"
          onClick={() => setCargaSelecionada('TOTAL')}
          className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium inline-flex items-center gap-2 border transition-all ${
            cargaSelecionada === 'TOTAL'
              ? 'bg-[#0B6E78] border-[#0B6E78] text-white font-semibold shadow-sm'
              : 'bg-white border-[#B6CBCB] text-[#4C666A] hover:border-[#0B6E78] hover:text-[#0F262A]'
          }`}
        >
          <span>Total Acumulado</span>
          <span
            className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
              cargaSelecionada === 'TOTAL'
                ? 'bg-white/20 text-white'
                : 'bg-[#DDE8E8] text-[#4C666A]'
            }`}
          >
            {cargasCompletas.length}
          </span>
        </button>

        <span className="w-px h-5 bg-[#B6CBCB] mx-1" />

        {todasCargas.map((c) => {
          const isCompleta = lotes.some((l) => Number(l.carga) === c);
          const isSelected = cargaSelecionada === c;

          return (
            <button
              key={c}
              type="button"
              onClick={() => setCargaSelecionada(c)}
              className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium inline-flex items-center gap-1.5 border transition-all ${
                isSelected
                  ? 'bg-[#0B6E78] border-[#0B6E78] text-white font-semibold shadow-sm'
                  : 'bg-white border-[#B6CBCB] text-[#4C666A] hover:border-[#0B6E78] hover:text-[#0F262A]'
              }`}
            >
              {!isCompleta && <span className="w-1.5 h-1.5 rounded-full bg-[#9A6410]" />}
              <span>Carga {c}</span>
            </button>
          );
        })}
      </div>

      {/* Alertas */}
      {!r.completa && (
        <div className="bg-[#F7EBD6] border border-[#9A6410]/30 rounded-xl p-4 flex gap-3 text-[13.5px] text-[#9A6410]">
          <AlertTriangle className="w-5 h-5 flex-none mt-0.5 text-[#9A6410]" />
          <div>
            <p className="font-semibold">
              {r.total ? 'Nenhuma carga completa encontrada.' : `Carga ${r.carga} está incompleta.`}
            </p>
            <p className="mt-1">
              Há {Object.keys(r.porTipo).length} lançamentos de CIF somando {brl(r.cifTotal)}, mas nenhum lote de matéria-prima cadastrado.
            </p>
          </div>
        </div>
      )}

      {r.total && cargasIncompletas.length > 0 && (
        <div className="bg-[#E9F0F0] border border-[#D2E0E0] rounded-xl p-3.5 flex gap-2.5 text-[13px] text-[#4C666A]">
          <Info className="w-4 h-4 flex-none mt-0.5 text-[#0B6E78]" />
          <p>
            O acumulado cobre as {r.nCargas} cargas completas. As cargas{' '}
            <b>{cargasIncompletas.join(', ')}</b> ficaram de fora por não terem lote de matéria-prima cadastrado.
          </p>
        </div>
      )}

      {r.completa && (
        <div className="space-y-6">
          {/* Grid de KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <KpiCard
              label="Faturamento"
              value={brl0(r.faturamento)}
              subtitle={`${nf(r.kgVendido, 1)} kg vendidos`}
            />
            <KpiCard
              label="Custo do camarão"
              value={brl0(r.custoMp)}
              subtitle={`${brl(r.mpPorKg)}/kg × ${nf(r.kgComprado, 0)} kg`}
            />
            <KpiCard
              label="CIF Total"
              value={brl0(r.cifTotal)}
              subtitle={`${brl(r.cifPorKgVend)}/kg vendido`}
            />
            <KpiCard
              label="Lucro operacional"
              value={brl0(r.lucroOp)}
              subtitle={`margem de ${pct(r.margem)}`}
              hero={true}
              valueClass={r.lucroOp >= 0 ? 'text-[#0F7A55]' : 'text-[#A9382A]'}
            />
            <KpiCard
              label="Lucro por kg"
              value={brl(r.lucroKg)}
              subtitle={`ROI de ${pct(r.roi)}`}
              valueClass={r.lucroKg >= 0 ? 'text-[#0F7A55]' : 'text-[#A9382A]'}
            />
          </div>

          {/* Card: Resultado da Operação & Cascata DRE */}
          <div className="bg-white border border-[#D2E0E0] rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#D2E0E0] bg-white">
              <h2 className="text-[12px] uppercase tracking-wider font-semibold text-[#7A9296]">
                Resultado da Operação (DRE)
              </h2>
            </div>
            <div className="p-5 space-y-5">
              <CompositionBar resultado={r} />
              <CascataDRE resultado={r} />
            </div>
          </div>

          {/* Card: Mecânica de Enxarque */}
          <div className="bg-white border border-[#D2E0E0] rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#D2E0E0] bg-white">
              <h2 className="text-[12px] uppercase tracking-wider font-semibold text-[#7A9296]">
                Como se chega à quantidade vendida (Enxarque)
              </h2>
            </div>
            <div className="p-5">
              <EnxarqueComparison resultado={r} parametros={parametros} />
            </div>
          </div>

          {/* Card: Custo Logístico por kg */}
          <div className="bg-white border border-[#D2E0E0] rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#D2E0E0] bg-white">
              <h2 className="text-[12px] uppercase tracking-wider font-semibold text-[#7A9296]">
                Custo logístico por kg
              </h2>
            </div>
            <div className="p-5">
              <LogisticsCostCard resultado={r} />
            </div>
          </div>

          {/* Card: Lotes da Carga */}
          <div className="bg-white border border-[#D2E0E0] rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#D2E0E0] bg-white flex justify-between items-center">
              <h2 className="text-[12px] uppercase tracking-wider font-semibold text-[#7A9296]">
                {r.total ? `Lotes de todas as cargas (${r.lotes.length})` : `Lotes da Carga ${r.carga}`}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13.5px] border-collapse">
                <thead>
                  <tr className="bg-white border-b border-[#D2E0E0] text-[11px] uppercase tracking-wider text-[#7A9296]">
                    {r.total && <th className="text-left py-3 px-3.5 font-semibold">Carga</th>}
                    <th className="text-left py-3 px-3.5 font-semibold">Lote</th>
                    <th className="text-left py-3 px-3.5 font-semibold">Classificação</th>
                    <th className="text-left py-3 px-3.5 font-semibold">Fornecedor</th>
                    <th className="text-right py-3 px-3.5 font-semibold">Compra R$/kg</th>
                    <th className="text-right py-3 px-3.5 font-semibold">Qtd Comprada</th>
                    <th className="text-right py-3 px-3.5 font-semibold">Caixas</th>
                    <th className="text-right py-3 px-3.5 font-semibold">Enxarque</th>
                    <th className="text-right py-3 px-3.5 font-semibold">Qtd Vendida</th>
                    <th className="text-right py-3 px-3.5 font-semibold">Venda R$/kg</th>
                    <th className="text-right py-3 px-3.5 font-semibold">Faturamento</th>
                    <th className="text-right py-3 px-3.5 font-semibold">Medido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D2E0E0]">
                  {r.lotes.map((l, idx) => (
                    <tr key={idx} className="hover:bg-[#E9F0F0]/50 transition-colors">
                      {r.total && <td className="text-left py-2.5 px-3.5 font-medium">Carga {l.carga}</td>}
                      <td className="text-left py-2.5 px-3.5">{l.lote}</td>
                      <td className="text-left py-2.5 px-3.5 font-medium">{l.classificacao || '—'}</td>
                      <td className="text-left py-2.5 px-3.5 text-[#4C666A]">{l.fornecedor || '—'}</td>
                      <td className="text-right py-2.5 px-3.5 font-mono">{nf(l.pc)}</td>
                      <td className="text-right py-2.5 px-3.5 font-mono">{nf(l.qc, 0)}</td>
                      <td className="text-right py-2.5 px-3.5 font-mono">{nf(l.caixas, 1)}</td>
                      <td className="text-right py-2.5 px-3.5 font-mono">{nf(l.enxPadrao, 1)} kg</td>
                      <td className="text-right py-2.5 px-3.5 font-mono font-semibold text-[#0B6E78]">
                        {nf(l.qVend, 1)}
                      </td>
                      <td className="text-right py-2.5 px-3.5 font-mono">{nf(l.pv)}</td>
                      <td className="text-right py-2.5 px-3.5 font-mono font-semibold">
                        {brl(l.faturamento)}
                      </td>
                      <td className="text-right py-2.5 px-3.5 font-mono text-xs">
                        {l.qm ? (
                          <span>
                            {nf(l.qm, 0)}{' '}
                            <span className="text-[#7A9296]">
                              ({l.desvio !== null && l.desvio >= 0 ? '+' : ''}
                              {nf(l.desvio, 0)})
                            </span>
                          </span>
                        ) : (
                          <span className="text-[#7A9296]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#E9F0F0] font-semibold border-t-2 border-[#B6CBCB]">
                    <td colSpan={r.total ? 5 : 4} className="text-left py-3 px-3.5 text-[#0F262A]">
                      Total Consolidado
                    </td>
                    <td className="text-right py-3 px-3.5 font-mono">{nf(r.kgComprado, 0)}</td>
                    <td className="text-right py-3 px-3.5 font-mono">{nf(r.caixas, 1)}</td>
                    <td className="text-right py-3 px-3.5 font-mono">{nf(r.enxPadrao, 1)} kg</td>
                    <td className="text-right py-3 px-3.5 font-mono text-[#0B6E78]">
                      {nf(r.kgVendido, 1)}
                    </td>
                    <td className="text-right py-3 px-3.5" />
                    <td className="text-right py-3 px-3.5 font-mono">{brl(r.faturamento)}</td>
                    <td className="text-right py-3 px-3.5 font-mono">
                      {r.kgMedido ? nf(r.kgMedido, 0) : '—'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Card: Rateio CIF */}
          <div className="bg-white border border-[#D2E0E0] rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#D2E0E0] bg-white flex justify-between items-center">
              <h2 className="text-[12px] uppercase tracking-wider font-semibold text-[#7A9296]">
                Custos Indiretos e Rateio por kg
              </h2>
              <button
                type="button"
                onClick={() => setMostrarTodosCif(!mostrarTodosCif)}
                className="text-xs font-semibold text-[#0B6E78] hover:underline"
              >
                {mostrarTodosCif ? 'Ocultar tipos sem lançamento' : 'Mostrar tipos sem lançamento'}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13.5px] border-collapse">
                <thead>
                  <tr className="bg-white border-b border-[#D2E0E0] text-[11px] uppercase tracking-wider text-[#7A9296]">
                    <th className="text-left py-3 px-3.5 font-semibold">Tipo de Custo</th>
                    <th className="text-right py-3 px-3.5 font-semibold">Total</th>
                    <th className="text-right py-3 px-3.5 font-semibold">% do CIF</th>
                    <th className="text-right py-3 px-3.5 font-semibold">Por kg Comprado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D2E0E0]">
                  {(mostrarTodosCif ? TIPOS_CIF : TIPOS_CIF.filter((t) => r.porTipo[t])).map((t) => {
                    const v = r.porTipo[t] || 0;
                    return (
                      <tr key={t} className="hover:bg-[#E9F0F0]/50 transition-colors">
                        <td className="text-left py-2.5 px-3.5 font-medium">{t}</td>
                        <td className={`text-right py-2.5 px-3.5 font-mono ${v ? 'text-[#0F262A]' : 'text-[#7A9296]'}`}>
                          {v ? brl(v) : '—'}
                        </td>
                        <td className={`text-right py-2.5 px-3.5 font-mono ${v ? 'text-[#0F262A]' : 'text-[#7A9296]'}`}>
                          {v && r.cifTotal ? pct(v / r.cifTotal) : '—'}
                        </td>
                        <td className={`text-right py-2.5 px-3.5 font-mono ${v ? 'text-[#0F262A]' : 'text-[#7A9296]'}`}>
                          {v && r.kgComprado ? brl(v / r.kgComprado) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-[#E9F0F0] font-semibold border-t-2 border-[#B6CBCB]">
                    <td className="text-left py-3 px-3.5">CIF Total</td>
                    <td className="text-right py-3 px-3.5 font-mono">{brl(r.cifTotal)}</td>
                    <td className="text-right py-3 px-3.5 font-mono">100,0%</td>
                    <td className="text-right py-3 px-3.5 font-mono">{brl(r.cifPorKg)}</td>
                  </tr>
                  <tr className="bg-[#E9F0F0] text-sm text-[#4C666A]">
                    <td className="text-left py-2 px-3.5">(−) Receita do Enxarque</td>
                    <td className="text-right py-2 px-3.5 font-mono text-[#A9382A]">{brl(-r.receitaEnx)}</td>
                    <td className="text-right py-2 px-3.5" />
                    <td className="text-right py-2 px-3.5 font-mono text-[#A9382A]">
                      {r.kgComprado ? brl(-r.receitaEnx / r.kgComprado) : '—'}
                    </td>
                  </tr>
                  <tr className="bg-[#E9F0F0] font-bold border-t border-[#D2E0E0]">
                    <td className="text-left py-2.5 px-3.5">Custo Logístico Líquido</td>
                    <td className="text-right py-2.5 px-3.5 font-mono">{brl(r.cifLiquido)}</td>
                    <td className="text-right py-2.5 px-3.5" />
                    <td className="text-right py-2.5 px-3.5 font-mono text-[#0B6E78]">
                      {brl(r.logPorKg)} <span className="text-xs font-normal text-[#4C666A]">/kg</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Card: Comparativo entre Cargas */}
          <div className="bg-white border border-[#D2E0E0] rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#D2E0E0] bg-white">
              <h2 className="text-[12px] uppercase tracking-wider font-semibold text-[#7A9296]">
                Comparativo Geral entre Cargas (Custo Total por KG Vendido)
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13.5px] border-collapse">
                <thead>
                  <tr className="bg-white border-b border-[#D2E0E0] text-[11px] uppercase tracking-wider text-[#7A9296]">
                    <th className="text-left py-3 px-3.5 font-semibold">Carga</th>
                    <th className="text-right py-3 px-3.5 font-semibold">Kg Vendidos</th>
                    <th className="text-right py-3 px-3.5 font-semibold">Faturamento</th>
                    <th className="text-right py-3 px-3.5 font-semibold">Camarão</th>
                    <th className="text-right py-3 px-3.5 font-semibold">CIF</th>
                    <th className="text-right py-3 px-3.5 font-semibold text-[#0B6E78]">Custo R$/kg (Vendido)</th>
                    <th className="text-right py-3 px-3.5 font-semibold">Lucro Op.</th>
                    <th className="text-right py-3 px-3.5 font-semibold">Margem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D2E0E0]">
                  {todasCargas.map((c) => {
                    const rc = calcularResultado(c, lotes, cif, parametros);
                    if (!rc.completa) {
                      return (
                        <tr key={c} className="hover:bg-[#E9F0F0]/50 text-[#7A9296]">
                          <td className="text-left py-2.5 px-3.5 font-medium">Carga {c}</td>
                          <td colSpan={7} className="text-left py-2.5 px-3.5 italic text-xs">
                            sem lote de matéria-prima cadastrado
                          </td>
                        </tr>
                      );
                    }
                    const isSelected = cargaSelecionada === c;
                    return (
                      <tr
                        key={c}
                        onClick={() => setCargaSelecionada(c)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#DBEDEE]/70 font-medium' : 'hover:bg-[#E9F0F0]/50'
                        }`}
                      >
                        <td className="text-left py-2.5 px-3.5 font-medium">
                          Carga {c} {isSelected && <span className="text-[11px] text-[#0B6E78]">· ativa</span>}
                        </td>
                        <td className="text-right py-2.5 px-3.5 font-mono">{nf(rc.kgVendido, 1)}</td>
                        <td className="text-right py-2.5 px-3.5 font-mono">{brl0(rc.faturamento)}</td>
                        <td className="text-right py-2.5 px-3.5 font-mono">{brl0(rc.custoMp)}</td>
                        <td className="text-right py-2.5 px-3.5 font-mono">{brl0(rc.cifTotal)}</td>
                        <td className="text-right py-2.5 px-3.5 font-mono font-semibold text-[#0B6E78]">
                          {brl(rc.custoPorKg)}
                        </td>
                        <td className={`text-right py-2.5 px-3.5 font-mono font-semibold ${rc.lucroOp >= 0 ? 'text-[#0F7A55]' : 'text-[#A9382A]'}`}>
                          {brl0(rc.lucroOp)}
                        </td>
                        <td className={`text-right py-2.5 px-3.5 font-mono font-semibold ${rc.lucroOp >= 0 ? 'text-[#0F7A55]' : 'text-[#A9382A]'}`}>
                          {pct(rc.margem)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  {(() => {
                    const rt = calcularResultado('TOTAL', lotes, cif, parametros);
                    if (!rt.completa) return null;
                    return (
                      <tr
                        onClick={() => setCargaSelecionada('TOTAL')}
                        className={`cursor-pointer border-t-2 border-[#B6CBCB] font-bold ${
                          cargaSelecionada === 'TOTAL' ? 'bg-[#DBEDEE]' : 'bg-[#E9F0F0]'
                        }`}
                      >
                        <td className="text-left py-3 px-3.5">
                          Total Acumulado {cargaSelecionada === 'TOTAL' && <span className="text-[11px] text-[#0B6E78]">· ativo</span>}
                        </td>
                        <td className="text-right py-3 px-3.5 font-mono">{nf(rt.kgVendido, 1)}</td>
                        <td className="text-right py-3 px-3.5 font-mono">{brl0(rt.faturamento)}</td>
                        <td className="text-right py-3 px-3.5 font-mono">{brl0(rt.custoMp)}</td>
                        <td className="text-right py-3 px-3.5 font-mono">{brl0(rt.cifTotal)}</td>
                        <td className="text-right py-3 px-3.5 font-mono text-[#0B6E78]">{brl(rt.custoPorKg)}</td>
                        <td className={`text-right py-3.5 px-3.5 font-mono ${rt.lucroOp >= 0 ? 'text-[#0F7A55]' : 'text-[#A9382A]'}`}>
                          {brl0(rt.lucroOp)}
                        </td>
                        <td className={`text-right py-3.5 px-3.5 font-mono ${rt.lucroOp >= 0 ? 'text-[#0F7A55]' : 'text-[#A9382A]'}`}>
                          {pct(rt.margem)}
                        </td>
                      </tr>
                    );
                  })()}
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
