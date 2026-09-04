import React, { useRef, useState } from 'react';
import { Parametros, Lote, CifLancamento } from '../types';
import { dataLonga, hoje } from '../lib/calculations';
import { Download, Upload, RotateCcw, CheckCircle, AlertCircle, Info } from 'lucide-react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cargasUnicas = Array.from(new Set([...lotes.map((l) => l.carga), ...cif.map((c) => c.carga)]));

  const mostrarMensagem = (texto: string, tipo: 'ok' | 'erro') => {
    setMensagem({ texto, tipo });
    setTimeout(() => setMensagem(null), 5000);
  };

  const handleExportar = () => {
    const payload = {
      formato: 'seago-calculadora',
      versao: 1,
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

  const divergencias = [
    {
      titulo: 'Comissão de vendedor calculada fora do cadastro',
      descricao:
        'Na Revisão da planilha original ela era digitada à mão (R$ 6.192 na carga 5), enquanto o cadastro CIF trazia zero. Aqui ela vem sempre do lançamento do CIF.'
    },
    {
      titulo: 'Quantidade vendida usava duas réguas',
      descricao:
        'A planilha multiplicava o preço por 12.384,5 kg em uma linha e pela quantidade final nas outras. Agora utiliza-se rigorosamente a quantidade final enxarcada padrão.'
    },
    {
      titulo: 'Custo por kg somado ao custo total',
      descricao:
        'No lucro operacional antigo a matéria-prima entrava como R$ 24,32 contra faturamento de R$ 334 mil. Aqui entra o custo total integral da carga.'
    },
    {
      titulo: 'Divisor de caixas unificado',
      descricao:
        'Havia divisão por 15,5 kg no cadastro e por 16 kg na revisão. Agora é um parâmetro único configurável (padrão 16 kg).'
    },
    {
      titulo: 'Erro de referência corrigido',
      descricao:
        'A célula antiga do custo logístico por kg apontava para erro #REF!, que foi saneado no motor de cálculo atual.'
    }
  ];

  return (
    <section className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-end justify-between flex-wrap gap-4 pb-2 border-b border-[#D2E0E0]">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight text-[#0F262A]">
            Parâmetros & Dados do Sistema
          </h2>
          <p className="text-[13.5px] text-[#4C666A] mt-1 max-w-[650px]">
            Configure as regras globais de cálculo, exporte backups e gerencie a base de dados.
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

      {/* Card 1: Parâmetros Globais de Cálculo */}
      <div className="bg-white border border-[#D2E0E0] rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#D2E0E0] bg-white">
          <h2 className="text-[12px] uppercase tracking-wider font-semibold text-[#7A9296]">
            Regras de Cálculo
          </h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-[11.5px] font-semibold text-[#7A9296] uppercase mb-1">
                Kg de camarão por caixa
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
                Padrão 16 kg. Define a quantidade de caixas geradas por lote.
              </p>
            </div>

            <div>
              <label className="block text-[11.5px] font-semibold text-[#7A9296] uppercase mb-1">
                Enxarque padrão por caixa (kg)
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
                Padrão 1 kg por caixa adicionado ao peso na pesagem de venda.
              </p>
            </div>

            <div>
              <label className="block text-[11.5px] font-semibold text-[#7A9296] uppercase mb-1">
                Alíquota de imposto (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0"
                value={parametros.aliquota || ''}
                onChange={(e) => onAtualizarParametros({ aliquota: Number(e.target.value) || 0 })}
                className="w-full p-2.5 border border-[#B6CBCB] rounded-lg text-sm bg-white font-mono focus:outline-none focus:border-[#0B6E78]"
              />
              <p className="text-[11.5px] text-[#7A9296] mt-1">
                Incide sobre o faturamento bruto.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Gestão de Dados e Backup */}
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

      {/* Card 3: Auditoria e Divergências da Planilha */}
      <div className="bg-white border border-[#D2E0E0] rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#D2E0E0] bg-white">
          <h2 className="text-[12px] uppercase tracking-wider font-semibold text-[#7A9296]">
            Divergências Corrigidas em Relação à Planilha Excel Antiga
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
