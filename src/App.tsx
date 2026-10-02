import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { RevisaoView } from './components/RevisaoView';
import { MateriaPrimaView } from './components/MateriaPrimaView';
import { CifView } from './components/CifView';
import { ParametrosView } from './components/ParametrosView';
import { ModalLote } from './components/ModalLote';
import { ModalCif } from './components/ModalCif';
import { Lote, CifLancamento, Parametros } from './types';
import {
  carregarDados,
  salvarDadosLocal,
  salvarLoteDb,
  removerLoteDb,
  salvarCifDb,
  removerCifDb,
  salvarParametrosDb,
  sincronizarComSupabase,
  isSupabaseConfigured
} from './lib/supabase';
import { PARAMETROS_PADRAO, DADOS_INICIAIS } from './lib/mockData';
import { getCargas } from './lib/calculations';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'revisao' | 'mp' | 'cif' | 'param'>('revisao');
  const [cargaSelecionada, setCargaSelecionada] = useState<number | 'TOTAL'>('TOTAL');
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [cif, setCif] = useState<CifLancamento[]>([]);
  const [parametros, setParametros] = useState<Parametros>(PARAMETROS_PADRAO);
  const [fonte, setFonte] = useState<'supabase' | 'local'>('local');
  const [carregando, setCarregando] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState<{ mensagem: string; tipo: 'ok' | 'erro' } | null>(null);

  // Estados dos Modais
  const [modalLoteAberto, setModalLoteAberto] = useState(false);
  const [loteParaEditar, setLoteParaEditar] = useState<{ lote: Lote; index: number } | null>(null);

  const [modalCifAberto, setModalCifAberto] = useState(false);
  const [cifParaEditar, setCifParaEditar] = useState<{ cif: CifLancamento; index: number } | null>(null);

  const mostrarToast = (mensagem: string, tipo: 'ok' | 'erro' = 'ok') => {
    setToast({ mensagem, tipo });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  useEffect(() => {
    async function inicializar() {
      setCarregando(true);
      const res = await carregarDados();
      setLotes(res.lotes);
      setCif(res.cif);
      setParametros(res.parametros);
      setFonte(res.fonte);

      const listaCargas = getCargas(res.lotes, res.cif);
      if (listaCargas.length > 0) {
        setCargaSelecionada(listaCargas[listaCargas.length - 1]); // Seleciona a carga mais recente inicialmente
      }
      setCarregando(false);
    }
    inicializar();
  }, []);

  const handleSincronizar = async () => {
    setIsSyncing(true);
    const res = await sincronizarComSupabase(lotes, cif, parametros);
    setIsSyncing(false);
    if (res.success) {
      mostrarToast('Sincronização com o Supabase concluída com sucesso!');
    } else {
      mostrarToast(res.message, 'erro');
    }
  };

  // Funções de CRUD: Lotes
  const handleSalvarLote = async (lote: Lote, index?: number): Promise<string | void> => {
    // Validação de colisão de lote na mesma carga
    const colide = lotes.some(
      (x, i) => i !== index && Number(x.carga) === Number(lote.carga) && Number(x.lote) === Number(lote.lote)
    );
    if (colide) {
      return `Já existe o Lote ${lote.lote} na Carga ${lote.carga}.`;
    }

    let loteSalvo = lote;
    if (isSupabaseConfigured) {
      try {
        loteSalvo = await salvarLoteDb(lote);
      } catch (err: any) {
        console.error('Erro ao salvar lote no Supabase:', err);
        return 'Erro ao gravar no banco de dados: ' + (err.message || 'Falha de conexão');
      }
    }

    let novosLotes: Lote[];
    if (index !== undefined && index >= 0) {
      novosLotes = lotes.map((item, idx) => (idx === index ? loteSalvo : item));
    } else {
      novosLotes = [...lotes, loteSalvo];
      setCargaSelecionada(loteSalvo.carga);
    }

    setLotes(novosLotes);
    salvarDadosLocal(novosLotes, cif, parametros);
    mostrarToast(`Lote ${loteSalvo.lote} da Carga ${loteSalvo.carga} salvo com sucesso!`);
  };

  const handleRemoverLote = async (index: number): Promise<void> => {
    const loteParaRemover = lotes[index];
    if (isSupabaseConfigured && loteParaRemover) {
      try {
        await removerLoteDb(loteParaRemover);
      } catch (err: any) {
        console.error('Erro ao remover lote do Supabase:', err);
        mostrarToast('Erro ao remover lote no banco: ' + err.message, 'erro');
      }
    }

    const novosLotes = lotes.filter((_, i) => i !== index);
    setLotes(novosLotes);
    salvarDadosLocal(novosLotes, cif, parametros);
    mostrarToast('Lote removido com sucesso!');
  };

  // Funções de CRUD: CIF
  const handleSalvarCif = async (itemCif: CifLancamento, index?: number): Promise<string | void> => {
    let cifSalvo = itemCif;
    if (isSupabaseConfigured) {
      try {
        cifSalvo = await salvarCifDb(itemCif);
      } catch (err: any) {
        console.error('Erro ao salvar CIF no Supabase:', err);
        return 'Erro ao gravar lançamento no banco: ' + (err.message || 'Falha de conexão');
      }
    }

    let novosCif: CifLancamento[];
    if (index !== undefined && index >= 0) {
      novosCif = cif.map((item, idx) => (idx === index ? cifSalvo : item));
    } else {
      novosCif = [...cif, cifSalvo];
      setCargaSelecionada(cifSalvo.carga);
    }

    setCif(novosCif);
    salvarDadosLocal(lotes, novosCif, parametros);
    mostrarToast(`Lançamento "${cifSalvo.tipo}" salvo com sucesso!`);
  };

  const handleRemoverCif = async (index: number): Promise<void> => {
    const cifParaRemover = cif[index];
    if (isSupabaseConfigured && cifParaRemover) {
      try {
        await removerCifDb(cifParaRemover);
      } catch (err: any) {
        console.error('Erro ao remover CIF do Supabase:', err);
        mostrarToast('Erro ao remover lançamento no banco: ' + err.message, 'erro');
      }
    }

    const novosCif = cif.filter((_, i) => i !== index);
    setCif(novosCif);
    salvarDadosLocal(lotes, novosCif, parametros);
    mostrarToast('Lançamento removido com sucesso!');
  };

  const handleAtualizarParametros = async (novos: Partial<Parametros>) => {
    const atualizados: Parametros = { ...parametros, ...novos };
    setParametros(atualizados);
    salvarDadosLocal(lotes, cif, atualizados);

    if (isSupabaseConfigured) {
      try {
        await salvarParametrosDb(atualizados);
        mostrarToast('Parâmetros salvos no banco com sucesso!');
      } catch (err: any) {
        console.error('Erro ao salvar parâmetros no Supabase:', err);
        mostrarToast('Aviso: Parâmetros salvos localmente (banco pendente)', 'erro');
      }
    } else {
      mostrarToast('Parâmetros atualizados localmente!');
    }
  };

  // Carga ativa para novos registros
  const todasCargas = getCargas(lotes, cif);
  const cargaAtiva = cargaSelecionada === 'TOTAL' ? todasCargas[todasCargas.length - 1] || 1 : cargaSelecionada;

  if (carregando) {
    return (
      <div className="min-h-screen bg-[#F2F6F6] flex items-center justify-center text-[#0F262A]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#0B6E78] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-[#4C666A]">Carregando calculadora SeaGO...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F6F6] text-[#0F262A] flex flex-col selection:bg-[#DBEDEE] selection:text-[#0B6E78] relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-in slide-in-from-top-3 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
              toast.tipo === 'ok'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-rose-50 text-rose-800 border-rose-300'
            }`}
          >
            {toast.tipo === 'ok' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-none" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-none" />
            )}
            <span>{toast.mensagem}</span>
          </div>
        </div>
      )}

      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        fonte={fonte}
        onSync={handleSincronizar}
        isSyncing={isSyncing}
      />

      <main className="flex-1 max-w-[1120px] w-full mx-auto px-5 py-6">
        {activeTab === 'revisao' && (
          <RevisaoView
            lotes={lotes}
            cif={cif}
            parametros={parametros}
            cargaSelecionada={cargaSelecionada}
            setCargaSelecionada={setCargaSelecionada}
          />
        )}

        {activeTab === 'mp' && (
          <MateriaPrimaView
            lotes={lotes}
            parametros={parametros}
            onAdicionar={() => {
              setLoteParaEditar(null);
              setModalLoteAberto(true);
            }}
            onEditar={(lote, index) => {
              setLoteParaEditar({ lote, index });
              setModalLoteAberto(true);
            }}
          />
        )}

        {activeTab === 'cif' && (
          <CifView
            cif={cif}
            onAdicionar={() => {
              setCifParaEditar(null);
              setModalCifAberto(true);
            }}
            onEditar={(item, index) => {
              setCifParaEditar({ cif: item, index });
              setModalCifAberto(true);
            }}
          />
        )}

        {activeTab === 'param' && (
          <ParametrosView
            parametros={parametros}
            onAtualizarParametros={handleAtualizarParametros}
            lotes={lotes}
            cif={cif}
            onImportarDados={async (dados) => {
              const p = dados.parametros || parametros;
              setLotes(dados.lotes);
              setCif(dados.cif);
              setParametros(p);
              salvarDadosLocal(dados.lotes, dados.cif, p);
              if (isSupabaseConfigured) {
                await sincronizarComSupabase(dados.lotes, dados.cif, p);
              }
              mostrarToast('Dados importados e salvos com sucesso!');
            }}
            onRestaurarOriginais={async () => {
              setLotes(DADOS_INICIAIS.lotes);
              setCif(DADOS_INICIAIS.cif);
              setParametros(PARAMETROS_PADRAO);
              salvarDadosLocal(DADOS_INICIAIS.lotes, DADOS_INICIAIS.cif, PARAMETROS_PADRAO);
              if (isSupabaseConfigured) {
                await sincronizarComSupabase(DADOS_INICIAIS.lotes, DADOS_INICIAIS.cif, PARAMETROS_PADRAO);
              }
              mostrarToast('Dados originais restaurados com sucesso!');
            }}
          />
        )}
      </main>

      <footer className="mt-12 py-5 border-t border-[#D2E0E0] text-center text-xs text-[#7A9296]">
        SeaGO · Calculadora de Operação e Precificação · Dados sincronizados em tempo real com o banco de dados
      </footer>

      {/* Modais */}
      <ModalLote
        isOpen={modalLoteAberto}
        onClose={() => setModalLoteAberto(false)}
        loteParaEditar={loteParaEditar}
        cargaAtiva={cargaAtiva}
        parametros={parametros}
        onSalvar={handleSalvarLote}
        onRemover={handleRemoverLote}
      />

      <ModalCif
        isOpen={modalCifAberto}
        onClose={() => setModalCifAberto(false)}
        cifParaEditar={cifParaEditar}
        cargaAtiva={cargaAtiva}
        onSalvar={handleSalvarCif}
        onRemover={handleRemoverCif}
      />
    </div>
  );
}

export default App;
