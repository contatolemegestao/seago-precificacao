import React, { useState, useEffect } from 'react';
import { CifLancamento } from '../types';
import { TIPOS_CIF } from '../lib/mockData';
import { hoje, brl } from '../lib/calculations';
import { X, Trash2 } from 'lucide-react';

interface ModalCifProps {
  isOpen: boolean;
  onClose: () => void;
  cifParaEditar?: { cif: CifLancamento; index: number } | null;
  cargaAtiva: number;
  onSalvar: (cif: CifLancamento, index?: number) => string | void;
  onRemover?: (index: number) => void;
}

export const ModalCif: React.FC<ModalCifProps> = ({
  isOpen,
  onClose,
  cifParaEditar,
  cargaAtiva,
  onSalvar,
  onRemover
}) => {
  const isNovo = !cifParaEditar;

  const [formData, setFormData] = useState({
    data: hoje(),
    carga: cargaAtiva || 1,
    tipo: TIPOS_CIF[0],
    qtd: '',
    valor: ''
  });

  const [erro, setErro] = useState<string | null>(null);
  const [confirmandoRemocao, setConfirmandoRemocao] = useState(false);

  useEffect(() => {
    if (cifParaEditar) {
      const c = cifParaEditar.cif;
      setFormData({
        data: c.data || hoje(),
        carga: c.carga,
        tipo: c.tipo || TIPOS_CIF[0],
        qtd: c.qtd?.toString() || '',
        valor: c.valor?.toString() || ''
      });
    } else {
      setFormData({
        data: hoje(),
        carga: cargaAtiva || 1,
        tipo: TIPOS_CIF[0],
        qtd: '',
        valor: ''
      });
    }
    setErro(null);
    setConfirmandoRemocao(false);
  }, [cifParaEditar, cargaAtiva, isOpen]);

  if (!isOpen) return null;

  const qtdNum = Number(formData.qtd) || 0;
  const valNum = Number(formData.valor) || 0;
  const custoTotal = qtdNum * valNum;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.carga) {
      setErro('Informe o número da carga.');
      return;
    }

    const reg: CifLancamento = {
      ...(cifParaEditar?.cif.id ? { id: cifParaEditar.cif.id } : {}),
      ...(cifParaEditar?.cif.carga_id ? { carga_id: cifParaEditar.cif.carga_id } : {}),
      data: formData.data,
      carga: Number(formData.carga),
      tipo: formData.tipo,
      qtd: Number(formData.qtd) || 0,
      valor: Number(formData.valor) || 0
    };

    const erroRetorno = onSalvar(reg, cifParaEditar?.index);
    if (erroRetorno) {
      setErro(erroRetorno);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0F262A]/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-[#D2E0E0] rounded-2xl max-w-[540px] w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-5 border-b border-[#D2E0E0]">
          <div>
            <h3 className="text-[17px] font-semibold text-[#0F262A]">
              {isNovo ? 'Novo lançamento de CIF' : formData.tipo}
            </h3>
            <p className="text-[12.5px] text-[#7A9296]">
              {isNovo ? 'Custo indireto — logística e encargos da carga' : `Carga ${formData.carga}`}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            </div>

            <div>
              <label className="block text-[11.5px] font-semibold text-[#7A9296] uppercase mb-1">
                Tipo de Custo
              </label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                className="w-full p-2 border border-[#B6CBCB] rounded-lg text-sm bg-white focus:outline-none focus:border-[#0B6E78]"
              >
                {TIPOS_CIF.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-[11px] uppercase tracking-wider font-semibold text-[#7A9296]">
              Valores
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11.5px] font-semibold text-[#7A9296] uppercase mb-1">
                  Quantidade / Alíquota
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="Ex: 1 ou 0.013"
                  value={formData.qtd}
                  onChange={(e) => setFormData({ ...formData, qtd: e.target.value })}
                  className="w-full p-2 border border-[#B6CBCB] rounded-lg text-sm bg-white font-mono focus:outline-none focus:border-[#0B6E78]"
                />
                <p className="text-[11px] text-[#7A9296] mt-0.5">
                  Para seguro/ICMS use a alíquota (ex: 0.013 ou 0.15)
                </p>
              </div>
              <div>
                <label className="block text-[11.5px] font-semibold text-[#7A9296] uppercase mb-1">
                  Valor Unitário / Base R$
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  className="w-full p-2 border border-[#B6CBCB] rounded-lg text-sm bg-white font-mono focus:outline-none focus:border-[#0B6E78]"
                />
                <p className="text-[11px] text-[#7A9296] mt-0.5">
                  Para seguro, o valor segurado da nota fiscal
                </p>
              </div>
            </div>
          </fieldset>

          {/* Prévia do Custo Total */}
          <div className="bg-[#E9F0F0] border border-[#D2E0E0] rounded-[10px] p-3.5 flex justify-between items-center">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-[#7A9296]">
              Custo Total do Lançamento
            </span>
            <span className="text-[17px] font-mono font-bold text-[#0F262A]">
              {brl(custoTotal)}
            </span>
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
                  if (cifParaEditar) onRemover(cifParaEditar.index);
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
                Salvar Lançamento
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
