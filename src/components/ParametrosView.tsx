import React, { useRef, useState } from 'react';
import { Parametros, Lote, CifLancamento } from '../types';
import { dataLonga, hoje, getCargas, getParametrosDaCarga } from '../lib/calculations';
import { Download, Upload, RotateCcw, CheckCircle, AlertCircle, Info, Plus } from 'lucide-react';
import { DADOS_INICIAIS, PARAMETROS_PADRAO } from '../lib/mockData';

interface ParametrosViewProps {
  parametros: Parametros;
  onAtualizarParametros: (novos: Partial<Parametros>) => void;
  lotes: Lote[];
  cif: CifLancamento[];
  onImportarDados: (dados: { lotes: Lote[]; cif: CifLancamento[]; parametros?: Parametros }) => void;
  onRestaurarOriginais: () => void;
}

export const ParametrosView: React.FC<ParametrosViewProps> = ({
  parametros,
  onAtualizarParametros,
  lotes,
  cif,
  onImportarDados,
  onRestaurarOriginais
}) => {
  const [mensagem, setMensagem] = useState<{ texto: string; tipo: 'ok' | 'erro' } | null>(null);
  const [confirmandoReset, setConfirmandoReset] = useState(false);
  const [novaCargaNum, setNovaCargaNum] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cargasUnicas = getCargas(lotes, cif);

  const mostrarMensagem = (texto: string, tipo: 'ok' | 'erro') => {
    setMensagem({ texto, tipo });
    setTimeout(() => setMensagem(null), 5000);
  };

  const handleExportar = () => {
    const payload = {
      formato: 'seago-calculadora',
      versao: 2,
      exportadoEm: hoje(),
      parametros,
      lotes,
      cif
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seago-dados-${hoje()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    mostrarMensagem(`Arquivo JSON exportado com ${lotes.length} lotes e ${cif.length} lançamentos.`, 'ok');
  };

  const handleArquivoSelecionado = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onerror = () => mostrarMensagem('Não foi possível ler o arquivo.', 'erro');
    reader.onload = () => {
      try {
        const dados = JSON.parse(reader.result as string);
        if (!dados || !Array.isArray(dados.lotes) || !Array.isArray(dados.cif)) {
          mostrarMensagem('Arquivo inválido. Certifique-se de que é um JSON exportado pela calculadora SeaGO.', 'erro');
          return;
        }

        onImportarDados(dados);
        mostrarMensagem(`Importado com sucesso: ${dados.lotes.length} lotes e ${dados.cif.length} lançamentos CIF.`, 'ok');
      } catch (err) {
        mostrarMensagem('Erro ao ler arquivo JSON. Formato incorreto.', 'erro');
      }
    };
    reader.readAsText(file);
  };

  const handleAtualizarParametroCarga = (cargaNum: number, campo: 'kgCaixa' | 'enxarqueKg', valor: number) => {
    const porCargaAtual = { ...(parametros.porCarga || {}) };
    const cargaConfig = porCargaAtual[cargaNum] || {
      kgCaixa: parametros.kgCaixa || 16,
      enxarqueKg: parametros.enxarqueKg ?? 1
    };

    porCargaAtual[cargaNum] = {
      ...cargaConfig,
      [campo]: valor
    };

    onAtualizarParametros({ porCarga: porCargaAtual });
  };

  const handleAdicionarCargaParam = (e: React.FormEvent) => {
    e.preventDefault();
    const cNum = Number(novaCargaNum);
    if (!cNum || cNum < 1) {
      mostrarMensagem('Informe um número de carga válido.', 'erro');
      return;
    }

    const porCargaAtual = { ...(parametros.porCarga || {}) };
    if (!porCargaAtual[cNum]) {
      porCargaAtual[cNum] = {
        kgCaixa: parametros.kgCaixa || 16,
        enxarqueKg: parametros.enxarqueKg ?? 1
      };
      onAtualizarParametros({ porCarga: porCargaAtual });
      setNovaCargaNum('');
      mostrarMensagem(`Parâmetros da Carga ${cNum} adicionados.`, 'ok');
    } else {
      mostrarMensagem(`A Carga ${cNum} já está na lista.`, 'erro');
    }
  };

  const divergencias = [
    {
      titulo: 'Custo por kg calculado sobre o KG Vendido',
      descricao:
        'O custo total unitário da operação agora divide o investimento total pela quantidade efetivamente vendida (com enxarque), refletindo a margem real de venda.'
    },
    {
      titulo: 'Parâmetros flexíveis por Carga',
      descricao:
        'Permite configurar regras de kg por caixa e enxarque específicas para cada carga individualmente, respeitando variações operacionais de cada viagem.'
    },
    {
      titulo: 'Remoção de alíquota de imposto',
      descricao:
        'O motor de cálculo e DRE não deduzem imposto por padrão, simplificando o resultado operacional puro.'
    },
    {
      titulo: 'Comissão de vendedor unificada no CIF',
      descricao:
        'A comissão vem 100% dos lançamentos reais de CIF de cada carga, sem digitação manual paralela.'
    }
  ];

  // Lista de todas as cargas para exibir na tabela de parâmetros
  const todasCargasExibicao = Array.from(
    new Set([
      ...cargasUnicas,
      ...Object.keys(parametros.porCarga || {}).map(Number)
    ])
  ).sort((a, b) => a - b);

  return (
    <section className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-end justify-between flex-wrap gap-4 pb-2 border-b border-[#D2E0E0]">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight text-[#0F262A]">
            Parâmetros & Dados do Sistema
          </h2>
          <p className="text-[13.5px] text-[#4C666A] mt-1 max-w-[650px]">
            Configure as regras de cálculo por carga, gerencie backups e audite o sistema.
          </p>
        </div>
      </div>

      {mensagem && (
        <div
          className={`p-3.5 rounded-xl flex items-center gap-2.5 text-sm font-medium ${
            mensagem.tipo === 'ok'
              ? 'bg-[#DBEDEE] text-[#0B6E78] border border-[#0B6E78]/30'
              : 'bg-[#F6E1DE] text-[#A9382A] border border-[#A9382A]/30'
          }`}
        >
          {mensagem.tipo === 'ok' ? (
            <CheckCircle className="w-4 h-4 flex-none" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-none" />
          )}
          <span>{mensagem.texto}</span>
        </div>
      )}

      {/* Card 1: Parâmetros Por Carga */}
      <div className="bg-white border border-[#D2E0E0] rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#D2E0E0] bg-white flex justify-between items-center flex-wrap gap-3">
          <div>
            <h2 className="text-[12px] uppercase tracking-wider font-semibold text-[#7A9296]">
              Parâmetros de Cálculo por Carga
            </h2>
            <p className="text-[12.5px] text-[#4C666A] mt-0.5">
              Personalize o kg por caixa e enxarque para cada carga.
            </p>
          </div>

          <form onSubmit={handleAdicionarCargaParam} className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              placeholder="Nº Carga"
              value={novaCargaNum}
              onChange={(e) => setNovaCargaNum(e.target.value)}
              className="w-24 p-1.5 border border-[#B6CBCB] rounded-lg text-xs font-mono bg-white focus:outline-none focus:border-[#0B6E78]"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#0B6E78] hover:bg-[#0B6E78]/90 rounded-lg shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Carga</span>
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px] border-collapse">
            <thead>
              <tr className="bg-white border-b border-[#D2E0E0] text-[11px] uppercase tracking-wider text-[#7A9296]">
                <th className="text-left py-3 px-4 font-semibold">Carga</th>
                <th className="text-left py-3 px-4 font-semibold">Kg de Camarão / Caixa</th>
                <th className="text-left py-3 px-4 font-semibold">Enxarque Padrão / Caixa (kg)</th>
                <th className="text-right py-3 px-4 font-semibold">Status do Parâmetro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D2E0E0]">
              {todasCargasExibicao.map((cNum) => {
                const paramAtual = getParametrosDaCarga(cNum, parametros);
                const isCustom = Boolean(parametros.porCarga && parametros.porCarga[cNum]);

                return (
                  <tr key={cNum} className="hover:bg-[#E9F0F0]/50 transition-colors">
                    <td className="text-left py-3 px-4 font-semibold text-[#0F262A]">
                      Carga {cNum}
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={paramAtual.kgCaixa}
                          onChange={(e) =>
                            handleAtualizarParametroCarga(
                              cNum,
                              'kgCaixa',
                              Number(e.target.value) || 16
                            )
                          }
                          className="w-28 p-1.5 border border-[#B6CBCB] rounded-md text-sm font-mono bg-white focus:outline-none focus:border-[#0B6E78]"
                        />
                        <span className="text-xs text-[#7A9296]">kg</span>
                      </div>
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={paramAtual.enxarqueKg}
                          onChange={(e) =>
                            handleAtualizarParametroCarga(
                              cNum,
                              'enxarqueKg',
                              Number(e.target.value) || 0
                            )
                          }
                          className="w-28 p-1.5 border border-[#B6CBCB] rounded-md text-sm font-mono bg-white focus:outline-none focus:border-[#0B6E78]"
                        />
                        <span className="text-xs text-[#7A9296]">kg/cx</span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4">
                      <span
                        className={`inline-block text-[11px] px-2 py-0.5 rounded-full font-medium ${
                          isCustom
                            ? 'bg-[#DBEDEE] text-[#0B6E78]'
                            : 'bg-[#E9F0F0] text-[#7A9296]'
                        }`}
                      >
                        {isCustom ? 'Personalizado' : 'Padrão'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Card 2: Padrão Global (Fallback) */}
      <div className="bg-white border border-[#D2E0E0] rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#D2E0E0] bg-white">
          <h2 className="text-[12px] uppercase tracking-wider font-semibold text-[#7A9296]">
            Valores Padrão Globais (Para novas cargas)
          </h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[11.5px] font-semibold text-[#7A9296] uppercase mb-1">
                Kg de camarão por caixa (Padrão)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={parametros.kgCaixa}
                onChange={(e) => onAtualizarParametros({ kgCaixa: Number(e.target.value) || 16 })}
                className="w-full p-2.5 border border-[#B6CBCB] rounded-lg text-sm bg-white font-mono focus:outline-none focus:border-[#0B6E78]"
              />
              <p className="text-[11.5px] text-[#7A9296] mt-1">
                Padrão 16 kg. Utilizado caso a carga não possua valor personalizado.
              </p>
            </div>

            <div>
              <label className="block text-[11.5px] font-semibold text-[#7A9296] uppercase mb-1">
                Enxarque padrão por caixa em kg (Padrão)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={parametros.enxarqueKg}
                onChange={(e) => onAtualizarParametros({ enxarqueKg: Number(e.target.value) || 0 })}
                className="w-full p-2.5 border border-[#B6CBCB] rounded-lg text-sm bg-white font-mono focus:outline-none focus:border-[#0B6E78]"
              />
              <p className="text-[11.5px] text-[#7A9296] mt-1">
                Padrão 1 kg por caixa adicionado ao peso na venda.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Gestão de Dados e Backup */}
      <div className="bg-white border border-[#D2E0E0] rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#D2E0E0] bg-white">
          <h2 className="text-[12px] uppercase tracking-wider font-semibold text-[#7A9296]">
            Gestão da Base de Dados & Backup
          </h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#E9F0F0] p-4 rounded-xl border border-[#D2E0E0]">
            <div>
              <div className="text-[11px] uppercase tracking-wider font-semibold text-[#7A9296]">Cargas</div>
              <div className="text-[18px] font-mono font-bold text-[#0F262A]">{cargasUnicas.length}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider font-semibold text-[#7A9296]">Lotes de Camarão</div>
              <div className="text-[18px] font-mono font-bold text-[#0F262A]">{lotes.length}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider font-semibold text-[#7A9296]">Lançamentos CIF</div>
              <div className="text-[18px] font-mono font-bold text-[#0F262A]">{cif.length}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider font-semibold text-[#7A9296]">Última Alteração</div>
              <div className="text-[13px] font-medium text-[#0F262A] truncate">
                {parametros.atualizadoEm ? dataLonga(parametros.atualizadoEm) : 'Hoje'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap pt-2">
            <button
              type="button"
              onClick={handleExportar}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0B6E78] hover:bg-[#0B6E78]/90 rounded-lg shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Backup (JSON)</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#0F262A] bg-white border border-[#B6CBCB] hover:border-[#0B6E78] hover:text-[#0B6E78] rounded-lg transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Importar Arquivo JSON</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleArquivoSelecionado}
            />

            <div className="flex-1" />

            <button
              type="button"
              onClick={() => {
                if (!confirmandoReset) {
                  setConfirmandoReset(true);
                  setTimeout(() => setConfirmandoReset(false), 5000);
                  return;
                }
                onRestaurarOriginais();
                setConfirmandoReset(false);
                mostrarMensagem('Dados originais restaurados com sucesso.', 'ok');
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                confirmandoReset
                  ? 'bg-[#A9382A] text-white hover:bg-red-700'
                  : 'text-[#A9382A] border border-transparent hover:bg-[#F6E1DE]'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{confirmandoReset ? 'Confirmar Restauração Original' : 'Restaurar Dados Originais'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Card 4: Auditoria e Melhorias */}
      <div className="bg-white border border-[#D2E0E0] rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#D2E0E0] bg-white">
          <h2 className="text-[12px] uppercase tracking-wider font-semibold text-[#7A9296]">
            Regras Operacionais e Melhorias
          </h2>
        </div>
        <div className="p-5 space-y-3">
          {divergencias.map((item, idx) => (
            <div
              key={idx}
              className="bg-[#E9F0F0] border border-[#D2E0E0] rounded-xl p-3.5 flex gap-3 text-[13px] text-[#4C666A]"
            >
              <Info className="w-4 h-4 flex-none mt-0.5 text-[#0B6E78]" />
              <div>
                <p className="font-semibold text-[#0F262A]">{item.titulo}</p>
                <p className="mt-0.5">{item.descricao}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
