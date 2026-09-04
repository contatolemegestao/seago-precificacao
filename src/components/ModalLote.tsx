import React, { useState, useEffect } from 'react';
import { Lote, Parametros } from '../types';
import { hoje, nf, brl0, getParametrosDaCarga } from '../lib/calculations';
import { X, Trash2 } from 'lucide-react';

interface ModalLoteProps {
  isOpen: boolean;
  onClose: () => void;
  loteParaEditar?: { lote: Lote; index: number } | null;
  cargaAtiva: number;
  parametros: Parametros;
  onSalvar: (lote: Lote, index?: number) => string | void;
  onRemover?: (index: number) => void;
}

export const ModalLote: React.FC<ModalLoteProps> = ({
  isOpen,
  onClose,
  loteParaEditar,
  cargaAtiva,
  parametros,
  onSalvar,
  onRemover
}) => {
  const isNovo = !loteParaEditar;

  const [formData, setFormData] = useState({
    data: hoje(),
    carga: cargaAtiva || 1,
    lote: 1,
    fornecedor: '',
    classificacao: '',
    valor_compra_kg: '',
    qtd_comprada: '',
    qtd_final: '',
    valor_venda_kg: ''
  });

  const [erro, setErro] = useState<string | null>(null);
  const [confirmandoRemocao, setConfirmandoRemocao] = useState(false);

  useEffect(() => {
    if (loteParaEditar) {
      const l = loteParaEditar.lote;
      setFormData({
        data: l.data || hoje(),
        carga: l.carga,
        lote: l.lote,
        fornecedor: l.fornecedor || '',
        classificacao: l.classificacao || '',
        valor_compra_kg: l.valor_compra_kg?.toString() || '',
        qtd_comprada: l.qtd_comprada?.toString() || '',
        qtd_final: l.qtd_final ? l.qtd_final.toString() : '',
        valor_venda_kg: l.valor_venda_kg?.toString() || ''
      });
    } else {
      setFormData({
        data: hoje(),
        carga: cargaAtiva || 1,
        lote: 1,
        fornecedor: '',
        classificacao: '',
        valor_compra_kg: '',
        qtd_comprada: '',
        qtd_final: '',
        valor_venda_kg: ''
      });
    }
    setErro(null);
    setConfirmandoRemocao(false);
  }, [loteParaEditar, cargaAtiva, isOpen]);

  if (!isOpen) return null;

  // Prévia em tempo real
  const qc = Number(formData.qtd_comprada) || 0;
  const qm = Number(formData.qtd_final) || 0;
  const pc = Number(formData.valor_compra_kg) || 0;
  const pv = Number(formData.valor_venda_kg) || 0;
  const paramCarga = getParametrosDaCarga(Number(formData.carga) || 1, parametros);
  const kgCaixa = paramCarga.kgCaixa;
  const caixas = kgCaixa > 0 ? qc / kgCaixa : 0;
  const enx = caixas * paramCarga.enxarqueKg;
  const qVend = qc + enx;
  const custoMp = pc * qc;
  const faturamento = pv * qVend;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.carga) {
      setErro('Informe o número da carga.');
      return;
    }
    if (!formData.lote) {
      setErro('Informe o número do lote.');
      return;
    }

    const reg: Lote = {
      ...(loteParaEditar?.lote.id ? { id: loteParaEditar.lote.id } : {}),
      ...(loteParaEditar?.lote.carga_id ? { carga_id: loteParaEditar.lote.carga_id } : {}),
      data: formData.data,
      carga: Number(formData.carga),
      lote: Number(formData.lote),
      fornecedor: formData.fornecedor.trim(),
      classificacao: formData.classificacao.trim(),
      valor_compra_kg: Number(formData.valor_compra_kg) || 0,
      qtd_comprada: Number(formData.qtd_comprada) || 0,
      qtd_final: formData.qtd_final ? Number(formData.qtd_final) : null,
      valor_venda_kg: Number(formData.valor_venda_kg) || 0
    };

    const erroRetorno = onSalvar(reg, loteParaEditar?.index);
    if (erroRetorno) {
      setErro(erroRetorno);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0F262A]/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-[#D2E0E0] rounded-2xl max-w-[620px] w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-5 border-b border-[#D2E0E0]">
          <div>
            <h3 className="text-[17px] font-semibold text-[#0F262A]">
              {isNovo ? 'Novo lote de matéria-prima' : `Lote ${formData.lote} · Carga ${formData.carga}`}
            </h3>
            <p className="text-[12.5px] text-[#7A9296]">
              {isNovo ? 'Custo direto — dados de compra e venda do camarão' : 'Edição de lote'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#7A9296] hover:text-[#0F262A] p-1.5 rounded-lg hover:bg-[#E9F0F0] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <fieldset className="space-y-2">
            <legend className="text-[11px] uppercase tracking-wider font-semibold text-[#7A9296]">
              Identificação
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11.5px] font-semibold text-[#7A9296] uppercase mb-1">
                  Data da operação
                </label>
                <input
                  type="date"
                  required
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  className="w-full p-2 border border-[#B6CBCB] rounded-lg text-sm bg-white focus:outline-none focus:border-[#0B6E78]"
                />
              </div>
              <div>
                <label className="block text-[11.5px] font-semibold text-[#7A9296] uppercase mb-1">
                  Número da Carga
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.carga}
                  onChange={(e) => setFormData({ ...formData, carga: Number(e.target.value) })}
                  className="w-full p-2 border border-[#B6CBCB] rounded-lg text-sm bg-white font-mono focus:outline-none focus:border-[#0B6E78]"
                />
              </div>
              <div>
                <label className="block text-[11.5px] font-semibold text-[#7A9296] uppercase mb-1">
                  Número do Lote
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.lote}
                  onChange={(e) => setFormData({ ...formData, lote: Number(e.target.value) })}
                  className="w-full p-2 border border-[#B6CBCB] rounded-lg text-sm bg-white font-mono focus:outline-none focus:border-[#0B6E78]"
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-[11px] uppercase tracking-wider font-semibold text-[#7A9296]">
              Origem
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11.5px] font-semibold text-[#7A9296] uppercase mb-1">
                  Fornecedor
                </label>
                <input
                  type="text"
                  placeholder="Ex.: AGROVAC, AQUISA"
                  value={formData.fornecedor}
                  onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
                  className="w-full p-2 border border-[#B6CBCB] rounded-lg text-sm bg-white focus:outline-none focus:border-[#0B6E78]"
                />
              </div>
              <div>
                <label className="block text-[11.5px] font-semibold text-[#7A9296] uppercase mb-1">
                  Classificação
                </label>
                <input
                  type="text"
                  placeholder="Ex.: Camarão 60/70"
                  value={formData.classificacao}
                  onChange={(e) => setFormData({ ...formData, classificacao: e.target.value })}
                  className="w-full p-2 border border-[#B6CBCB] rounded-lg text-sm bg-white focus:outline-none focus:border-[#0B6E78]"
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-[11px] uppercase tracking-wider font-semibold text-[#7A9296]">
              Compra e Venda
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11.5px] font-semibold text-[#7A9296] uppercase mb-1">
                  Valor de Compra R$/kg
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={formData.valor_compra_kg}
                  onChange={(e) => setFormData({ ...formData, valor_compra_kg: e.target.value })}
                  className="w-full p-2 border border-[#B6CBCB] rounded-lg text-sm bg-white font-mono focus:outline-none focus:border-[#0B6E78]"
                />
              </div>
              <div>
                <label className="block text-[11.5px] font-semibold text-[#7A9296] uppercase mb-1">
                  Quantidade Comprada (kg)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0"
                  value={formData.qtd_comprada}
                  onChange={(e) => setFormData({ ...formData, qtd_comprada: e.target.value })}
                  className="w-full p-2 border border-[#B6CBCB] rounded-lg text-sm bg-white font-mono focus:outline-none focus:border-[#0B6E78]"
                />
              </div>
              <div>
                <label className="block text-[11.5px] font-semibold text-[#7A9296] uppercase mb-1">
                  Valor de Venda R$/kg
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={formData.valor_venda_kg}
                  onChange={(e) => setFormData({ ...formData, valor_venda_kg: e.target.value })}
                  className="w-full p-2 border border-[#B6CBCB] rounded-lg text-sm bg-white font-mono focus:outline-none focus:border-[#0B6E78]"
                />
              </div>
              <div>
                <label className="block text-[11.5px] font-semibold text-[#7A9296] uppercase mb-1">
                  Pesagem de Conferência (kg)
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="Opcional"
                  value={formData.qtd_final}
                  onChange={(e) => setFormData({ ...formData, qtd_final: e.target.value })}
                  className="w-full p-2 border border-[#B6CBCB] rounded-lg text-sm bg-white font-mono focus:outline-none focus:border-[#0B6E78]"
                />
                <p className="text-[11px] text-[#7A9296] mt-0.5">
                  Não altera o cálculo, serve para comparar com o padrão
                </p>
              </div>
            </div>
          </fieldset>

          {/* Prévia dos Cálculos */}
          <div className="bg-[#E9F0F0] border border-[#D2E0E0] rounded-[10px] p-3.5">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-[#7A9296] mb-2">
              Cálculo Automático
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <div className="text-[11.5px] text-[#7A9296]">Caixas</div>
                <div className="text-[14px] font-semibold font-mono text-[#0F262A]">
                  {nf(caixas, 1)}
                </div>
              </div>
              <div>
                <div className="text-[11.5px] text-[#7A9296]">Enxarque Padrão</div>
                <div className="text-[14px] font-semibold font-mono text-[#0F262A]">
                  {nf(enx, 1)} kg
                </div>
              </div>
              <div>
                <div className="text-[11.5px] text-[#7A9296]">Qtd Vendida</div>
                <div className="text-[14px] font-semibold font-mono text-[#0B6E78]">
                  {nf(qVend, 1)} kg
                </div>
              </div>
              <div>
                <div className="text-[11.5px] text-[#7A9296]">Custo Camarão</div>
                <div className="text-[14px] font-semibold font-mono text-[#A9382A]">
                  {brl0(custoMp)}
                </div>
              </div>
              <div>
                <div className="text-[11.5px] text-[#7A9296]">Faturamento</div>
                <div className="text-[14px] font-semibold font-mono text-[#0F7A55]">
                  {brl0(faturamento)}
                </div>
              </div>
              <div>
                <div className="text-[11.5px] text-[#7A9296]">Conferência</div>
                <div className="text-[14px] font-semibold font-mono text-[#0F262A]">
                  {qm ? `${qm - qVend >= 0 ? '+' : ''}${nf(qm - qVend, 1)} kg` : '—'}
                </div>
              </div>
            </div>
          </div>

          {erro && (
            <div className="text-[#A9382A] text-xs font-medium bg-[#F6E1DE] p-2.5 rounded-lg">
              {erro}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-[#D2E0E0]">
            {!isNovo && onRemover && (
              <button
                type="button"
                onClick={() => {
                  if (!confirmandoRemocao) {
                    setConfirmandoRemocao(true);
                    return;
                  }
                  if (loteParaEditar) onRemover(loteParaEditar.index);
                  onClose();
                }}
                className={`inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  confirmandoRemocao
                    ? 'bg-[#A9382A] text-white hover:bg-red-700'
                    : 'text-[#A9382A] hover:bg-[#F6E1DE]'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{confirmandoRemocao ? 'Confirmar Exclusão' : 'Remover'}</span>
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-[#4C666A] border border-[#B6CBCB] hover:bg-[#E9F0F0] rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-semibold text-white bg-[#0B6E78] hover:bg-[#0B6E78]/90 rounded-lg shadow-sm transition-colors"
              >
                Salvar Lote
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
