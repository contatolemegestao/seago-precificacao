import { createClient } from '@supabase/supabase-js';
import { Lote, CifLancamento, Parametros } from '../types';
import { DADOS_INICIAIS, PARAMETROS_PADRAO } from './mockData';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://sua-url-aqui.supabase.co'
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const STORAGE_KEY = 'seago-dados-v1';

export async function carregarDados(): Promise<{
  lotes: Lote[];
  cif: CifLancamento[];
  parametros: Parametros;
  fonte: 'supabase' | 'local';
}> {
  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Carrega parâmetros
      const { data: paramData } = await supabase.from('parametros').select('*').limit(1).maybeSingle();
      
      // 2. Carrega cargas para mapeamento de número
      const { data: cargasData } = await supabase.from('cargas').select('*');
      const cargaMap = new Map<string, number>();
      cargasData?.forEach(c => cargaMap.set(c.id, c.numero));

      // 3. Carrega lotes
      const { data: lotesData } = await supabase.from('lotes').select('*');
      const lotes: Lote[] = (lotesData || []).map(l => ({
        id: l.id,
        carga_id: l.carga_id,
        carga: cargaMap.get(l.carga_id) || 1,
        lote: l.numero_lote,
        data: l.data,
        fornecedor: l.fornecedor || '',
        classificacao: l.classificacao || '',
        gr_inicial: l.gr_inicial,
        gr_final: l.gr_final,
        valor_compra_kg: Number(l.valor_compra_kg),
        qtd_comprada: Number(l.qtd_comprada),
        qtd_final: l.qtd_final_medida ? Number(l.qtd_final_medida) : null,
        valor_venda_kg: Number(l.valor_venda_kg),
      }));

      // 4. Carrega CIF
      const { data: cifData } = await supabase.from('cif_lancamentos').select('*');
      const cif: CifLancamento[] = (cifData || []).map(c => ({
        id: c.id,
        carga_id: c.carga_id,
        carga: cargaMap.get(c.carga_id) || 1,
        data: c.data,
        tipo: c.tipo_custo,
        qtd: Number(c.qtd),
        valor: Number(c.valor_unitario),
      }));

      const parametros: Parametros = paramData ? {
        id: paramData.id,
        kgCaixa: Number(paramData.kg_caixa),
        enxarqueKg: Number(paramData.enxarque_kg),
        porCarga: {},
        atualizadoEm: paramData.updated_at
      } : PARAMETROS_PADRAO;

      if (lotes.length > 0 || cif.length > 0) {
        return { lotes, cif, parametros, fonte: 'supabase' };
      }
    } catch (err) {
      console.warn('Erro ao carregar do Supabase, recorrendo ao armazenamento local:', err);
    }
  }

  // Fallback para localStorage
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.lotes && parsed.cif) {
        return {
          lotes: parsed.lotes,
          cif: parsed.cif,
          parametros: parsed.parametros || PARAMETROS_PADRAO,
          fonte: 'local'
        };
      }
    }
  } catch (e) {
    console.error('Erro ao ler localStorage', e);
  }

  return {
    lotes: DADOS_INICIAIS.lotes,
    cif: DADOS_INICIAIS.cif,
    parametros: PARAMETROS_PADRAO,
    fonte: 'local'
  };
}

export async function salvarDadosLocal(
  lotes: Lote[],
  cif: CifLancamento[],
  parametros: Parametros
): Promise<void> {
  const payload = {
    lotes,
    cif,
    parametros: {
      ...parametros,
      atualizadoEm: new Date().toISOString().slice(0, 10)
    }
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export async function sincronizarComSupabase(
  lotes: Lote[],
  cif: CifLancamento[],
  parametros: Parametros
): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: 'Supabase não configurado. Dados salvos localmente no navegador.' };
  }

  try {
    // 1. Atualizar ou inserir parâmetros
    if (parametros.id) {
      await supabase.from('parametros').update({
        kg_caixa: parametros.kgCaixa,
        enxarque_kg: parametros.enxarqueKg
      }).eq('id', parametros.id);
    } else {
      const { data: p } = await supabase.from('parametros').select('id').limit(1).maybeSingle();
      if (p) {
        await supabase.from('parametros').update({
          kg_caixa: parametros.kgCaixa,
          enxarque_kg: parametros.enxarqueKg
        }).eq('id', p.id);
      } else {
        await supabase.from('parametros').insert({
          kg_caixa: parametros.kgCaixa,
          enxarque_kg: parametros.enxarqueKg
        });
      }
    }

    // 2. Garantir que as cargas existem no Supabase
    const numerosCargas = Array.from(new Set([
      ...lotes.map(l => l.carga),
      ...cif.map(c => c.carga)
    ]));

    for (const num of numerosCargas) {
      const { data: cargaExistente } = await supabase
        .from('cargas')
        .select('id')
        .eq('numero', num)
        .maybeSingle();

      if (!cargaExistente) {
        const dataOp = lotes.find(l => l.carga === num)?.data || cif.find(c => c.carga === num)?.data || new Date().toISOString().slice(0, 10);
        await supabase.from('cargas').insert({
          numero: num,
          data_operacao: dataOp,
          status: 'fechada'
        });
      }
    }

    return { success: true, message: 'Sincronizado com Supabase com sucesso!' };
  } catch (err: any) {
    console.error('Erro na sincronização:', err);
    return { success: false, message: 'Erro ao sincronizar: ' + (err.message || 'Erro desconhecido') };
  }
}
