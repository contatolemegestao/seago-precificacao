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
  sincronizarComSupabase,
  isSupabaseConfigured
} from './lib/supabase';
import { PARAMETROS_PADRAO, DADOS_INICIAIS } from './lib/mockData';
import { getCargas } from './lib/calculations';

export function App() {
  const [activeTab, setActiveTab] = useState<'revisao' | 'mp' | 'cif' | 'param'>('revisao');
  const [cargaSelecionada, setCargaSelecionada] = useState<number | 'TOTAL'>('TOTAL');
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [cif, setCif] = useState<CifLancamento[]>([]);
  const [parametros, setParametros] = useState<Parametros>(PARAMETROS_PADRAO);
  const [fonte, setFonte] = useState<'supabase' | 'local'>('local');
  const [carregando, setCarregando] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Estados dos Modais
  const [modalLoteAberto, setModalLoteAberto] = useState(false);
  const [loteParaEditar, setLoteParaEditar] = useState<{ lote: Lote; index: number } | null>(null);

  const [modalCifAberto, setModalCifAberto] = useState(false);
  const [cifParaEditar, setCifParaEditar] = useState<{ cif: CifLancamento; index: number } | null>(null);

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

  // Salva no localStorage ou Supabase sempre que houver alteração
  const atualizarEstado = (
    novosLotes: Lote[],
    novosCif: CifLancamento[],
    novosParams: Parametros
  ) => {
    setLotes(novosLotes);
    setCif(novosCif);
    setParametros(novosParams);
    salvarDadosLocal(novosLotes, novosCif, novosParams);
  };

  const handleSincronizar = async () => {
    setIsSyncing(true);
    await sincronizarComSupabase(lotes, cif, parametros);
    setIsSyncing(false);
  };

  // Funções de CRUD: Lotes
  const handleSalvarLote = (lote: Lote, index?: number): string | void => {
    // Validação de colisão de lote na mesma carga
    const colide = lotes.some(
      (x, i) => i !== index && Number(x.carga) === Number(lote.carga) && Number(x.lote) === Number(lote.lote)
    );
    if (colide) {
      return `Já existe o Lote ${lote.lote} na Carga ${lote.carga}.`;
    }

    let novosLotes: Lote[];
    if (index !== undefined && index >= 0) {
      novosLotes = lotes.map((item, idx) => (idx === index ? lote : item));
    } else {
      novosLotes = [...lotes, lote];
      setCargaSelecionada(lote.carga);
    }

    atualizarEstado(novosLotes, cif, parametros);
    if (isSupabaseConfigured) handleSincronizar();
  };

  const handleRemoverLote = (index: number) => {
    const novosLotes = lotes.filter((_, i) => i !== index);
    atualizarEstado(novosLotes, cif, parametros);
    if (isSupabaseConfigured) handleSincronizar();
  };

  // Funções de CRUD: CIF
  const handleSalvarCif = (itemCif: CifLancamento, index?: number): string | void => {
    let novosCif: CifLancamento[];
    if (index !== undefined && index >= 0) {
      novosCif = cif.map((item, idx) => (idx === index ? itemCif : item));
    } else {
      novosCif = [...cif, itemCif];
      setCargaSelecionada(itemCif.carga);
    }

    atualizarEstado(lotes, novosCif, parametros);
    if (isSupabaseConfigured) handleSincronizar();
  };

  const handleRemoverCif = (index: number) => {
    const novosCif = cif.filter((_, i) => i !== index);
    atualizarEstado(lotes, novosCif, parametros);
    if (isSupabaseConfigured) handleSincronizar();
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
    <div className="min-h-screen bg-[#F2F6F6] text-[#0F262A] flex flex-col selection:bg-[#DBEDEE] selection:text-[#0B6E78]">
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
            onAtualizarParametros={(novos) => {
              const atualizados = { ...parametros, ...novos };
              atualizarEstado(lotes, cif, atualizados);
              if (isSupabaseConfigured) handleSincronizar();
            }}
            lotes={lotes}
            cif={cif}
            onImportarDados={(dados) => {
              const p = dados.parametros || parametros;
              atualizarEstado(dados.lotes, dados.cif, p);
              if (isSupabaseConfigured) handleSincronizar();
            }}
            onRestaurarOriginais={() => {
              atualizarEstado(DADOS_INICIAIS.lotes, DADOS_INICIAIS.cif, PARAMETROS_PADRAO);
              if (isSupabaseConfigured) handleSincronizar();
            }}
          />
        )}
      </main>

      <footer className="mt-12 py-5 border-t border-[#D2E0E0] text-center text-xs text-[#7A9296]">
        SeaGO · Calculadora de Operação e Precificação · Dados auditados e recalculados pelo motor de regras
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
