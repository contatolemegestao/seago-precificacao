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

    // 1. Atualiza o estado da interface imediatamente
    let novosLotes: Lote[];
    if (index !== undefined && index >= 0) {
      novosLotes = lotes.map((item, idx) => (idx === index ? lote : item));
    } else {
      novosLotes = [...lotes, lote];
      setCargaSelecionada(lote.carga);
    }

    setLotes(novosLotes);
    salvarDadosLocal(novosLotes, cif, parametros);

    // 2. Persiste diretamente no Supabase em segundo plano
    if (isSupabaseConfigured) {
      salvarLoteDb(lote)
        .then((loteDb) => {
          // Atualiza com o ID do banco
          setLotes((atuais) =>
            atuais.map((item) =>
              Number(item.carga) === Number(lote.carga) && Number(item.lote) === Number(lote.lote)
                ? { ...item, id: loteDb.id, carga_id: loteDb.carga_id }
                : item
            )
          );
        })
        .catch((err) => {
          console.error('Erro ao persistir lote no Supabase:', err);
        });
    }
  };

  const handleRemoverLote = (index: number) => {
    const loteParaRemover = lotes[index];
    const novosLotes = lotes.filter((_, i) => i !== index);
    
    setLotes(novosLotes);
    salvarDadosLocal(novosLotes, cif, parametros);

    if (isSupabaseConfigured && loteParaRemover) {
      removerLoteDb(loteParaRemover).catch((err) => {
        console.error('Erro ao remover lote do Supabase:', err);
      });
    }
  };

  // Funções de CRUD: CIF
  const handleSalvarCif = (itemCif: CifLancamento, index?: number): string | void => {
    // 1. Atualiza o estado da interface imediatamente
    let novosCif: CifLancamento[];
    if (index !== undefined && index >= 0) {
      novosCif = cif.map((item, idx) => (idx === index ? itemCif : item));
    } else {
      novosCif = [...cif, itemCif];
      setCargaSelecionada(itemCif.carga);
    }

    setCif(novosCif);
    salvarDadosLocal(lotes, novosCif, parametros);

    // 2. Persiste diretamente no Supabase em segundo plano
    if (isSupabaseConfigured) {
      salvarCifDb(itemCif)
        .then((cifDb) => {
          // Atualiza com o ID do banco se for novo
          if (!itemCif.id && cifDb.id) {
            setCif((atuais) =>
              atuais.map((c, i) =>
                i === (index ?? atuais.length - 1) ? { ...c, id: cifDb.id, carga_id: cifDb.carga_id } : c
              )
            );
          }
        })
        .catch((err) => {
          console.error('Erro ao persistir CIF no Supabase:', err);
        });
    }
  };

  const handleRemoverCif = (index: number) => {
    const cifParaRemover = cif[index];
    const novosCif = cif.filter((_, i) => i !== index);

    setCif(novosCif);
    salvarDadosLocal(lotes, novosCif, parametros);

    if (isSupabaseConfigured && cifParaRemover) {
      removerCifDb(cifParaRemover).catch((err) => {
        console.error('Erro ao remover CIF do Supabase:', err);
      });
    }
  };

  const handleAtualizarParametros = (novos: Partial<Parametros>) => {
    const atualizados: Parametros = { ...parametros, ...novos };
    setParametros(atualizados);
    salvarDadosLocal(lotes, cif, atualizados);

    if (isSupabaseConfigured) {
      salvarParametrosDb(atualizados).catch((err) => {
        console.error('Erro ao salvar parâmetros no Supabase:', err);
      });
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
            onAtualizarParametros={handleAtualizarParametros}
            lotes={lotes}
            cif={cif}
            onImportarDados={(dados) => {
              const p = dados.parametros || parametros;
              setLotes(dados.lotes);
              setCif(dados.cif);
              setParametros(p);
              salvarDadosLocal(dados.lotes, dados.cif, p);
              if (isSupabaseConfigured) sincronizarComSupabase(dados.lotes, dados.cif, p);
            }}
            onRestaurarOriginais={() => {
              setLotes(DADOS_INICIAIS.lotes);
              setCif(DADOS_INICIAIS.cif);
              setParametros(PARAMETROS_PADRAO);
              salvarDadosLocal(DADOS_INICIAIS.lotes, DADOS_INICIAIS.cif, PARAMETROS_PADRAO);
              if (isSupabaseConfigured) sincronizarComSupabase(DADOS_INICIAIS.lotes, DADOS_INICIAIS.cif, PARAMETROS_PADRAO);
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
