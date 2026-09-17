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

const STORAGE_KEY = 'seago-dados-v2';

// Garante que a carga existe no Supabase e retorna seu ID
async function obterOuCriarCargaId(numeroCarga: number, dataOperacao?: string): Promise<string> {
  if (!supabase) throw new Error('Supabase não configurado');

  const { data: cargaExistente } = await supabase
    .from('cargas')
    .select('id')
    .eq('numero', numeroCarga)
    .maybeSingle();

  if (cargaExistente?.id) {
    return cargaExistente.id;
  }

  const { data: novaCarga, error } = await supabase
    .from('cargas')
    .insert({
      numero: numeroCarga,
      data_operacao: dataOperacao || new Date().toISOString().slice(0, 10),
      status: 'fechada'
    })
    .select('id')
    .single();

  if (error || !novaCarga) {
    throw new Error('Erro ao criar carga no Supabase: ' + error?.message);
  }

  return novaCarga.id;
}

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
      
      // 2. Carrega cargas para mapeamento de ID -> número
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

      // Tenta recuperar porCarga do localStorage caso exista
      let porCargaSalvo = {};
      try {
        const rawLocal = localStorage.getItem(STORAGE_KEY);
        if (rawLocal) {
          const parsed = JSON.parse(rawLocal);
          if (parsed.parametros?.porCarga) {
            porCargaSalvo = parsed.parametros.porCarga;
          }
        }
      } catch (e) {}

      const parametros: Parametros = paramData ? {
        id: paramData.id,
        kgCaixa: Number(paramData.kg_caixa) || 16,
        enxarqueKg: Number(paramData.enxarque_kg) ?? 1,
        porCarga: porCargaSalvo,
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

export function salvarDadosLocal(
  lotes: Lote[],
  cif: CifLancamento[],
  parametros: Parametros
): void {
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

// Salvar / Atualizar Lote diretamente no Supabase
export async function salvarLoteDb(lote: Lote): Promise<Lote> {
  if (!isSupabaseConfigured || !supabase) return lote;

  const cargaId = lote.carga_id || (await obterOuCriarCargaId(lote.carga, lote.data));

  const payload = {
    carga_id: cargaId,
    numero_lote: lote.lote,
    data: lote.data,
    fornecedor: lote.fornecedor,
    classificacao: lote.classificacao,
    gr_inicial: lote.gr_inicial,
    gr_final: lote.gr_final,
    valor_compra_kg: lote.valor_compra_kg,
    qtd_comprada: lote.qtd_comprada,
    qtd_final_medida: lote.qtd_final,
    valor_venda_kg: lote.valor_venda_kg
  };

  if (lote.id) {
    const { data, error } = await supabase
      .from('lotes')
      .update(payload)
      .eq('id', lote.id)
      .select('id, carga_id')
      .single();

    if (error) throw new Error('Erro ao atualizar lote: ' + error.message);
    return { ...lote, id: data.id, carga_id: data.carga_id };
  } else {
    const { data, error } = await supabase
      .from('lotes')
      .upsert(payload, { onConflict: 'carga_id,numero_lote' })
      .select('id, carga_id')
      .single();

    if (error) throw new Error('Erro ao inserir lote: ' + error.message);
    return { ...lote, id: data.id, carga_id: data.carga_id };
  }
}

// Remover Lote no Supabase
export async function removerLoteDb(lote: Lote): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  if (lote.id) {
    await supabase.from('lotes').delete().eq('id', lote.id);
  } else if (lote.carga_id) {
    await supabase.from('lotes').delete().eq('carga_id', lote.carga_id).eq('numero_lote', lote.lote);
  }
}

// Salvar / Atualizar CIF diretamente no Supabase
export async function salvarCifDb(cifItem: CifLancamento): Promise<CifLancamento> {
  if (!isSupabaseConfigured || !supabase) return cifItem;

  const cargaId = cifItem.carga_id || (await obterOuCriarCargaId(cifItem.carga, cifItem.data));

  const payload = {
    carga_id: cargaId,
    data: cifItem.data,
    tipo_custo: cifItem.tipo,
    qtd: cifItem.qtd,
    valor_unitario: cifItem.valor
  };

  if (cifItem.id) {
    const { data, error } = await supabase
      .from('cif_lancamentos')
      .update(payload)
      .eq('id', cifItem.id)
      .select('id, carga_id')
      .single();

    if (error) throw new Error('Erro ao atualizar CIF: ' + error.message);
    return { ...cifItem, id: data.id, carga_id: data.carga_id };
  } else {
    const { data, error } = await supabase
      .from('cif_lancamentos')
      .insert(payload)
      .select('id, carga_id')
      .single();

    if (error) throw new Error('Erro ao inserir CIF: ' + error.message);
    return { ...cifItem, id: data.id, carga_id: data.carga_id };
  }
}

// Remover CIF no Supabase
export async function removerCifDb(cifItem: CifLancamento): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  if (cifItem.id) {
    await supabase.from('cif_lancamentos').delete().eq('id', cifItem.id);
  }
}

// Salvar Parâmetros no Supabase
export async function salvarParametrosDb(parametros: Parametros): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  const { data: p } = await supabase.from('parametros').select('id').limit(1).maybeSingle();
  if (p?.id) {
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

// Sincronização em lote completa
export async function sincronizarComSupabase(
  lotes: Lote[],
  cif: CifLancamento[],
  parametros: Parametros
): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: 'Supabase não configurado. Dados salvos localmente no navegador.' };
  }

  try {
    // 1. Parâmetros
    await salvarParametrosDb(parametros);

    // 2. Cargas
    const numerosCargas = Array.from(new Set([
      ...lotes.map(l => l.carga),
      ...cif.map(c => c.carga)
    ]));

    for (const num of numerosCargas) {
      await obterOuCriarCargaId(num);
    }

    // 3. Salva todos os lotes
    for (const l of lotes) {
      await salvarLoteDb(l);
    }

    // 4. Salva todos os CIFs
    for (const c of cif) {
      await salvarCifDb(c);
    }

    return { success: true, message: 'Tudo sincronizado com o Supabase com sucesso!' };
  } catch (err: any) {
    console.error('Erro na sincronização completa:', err);
    return { success: false, message: 'Erro ao sincronizar: ' + (err.message || 'Erro desconhecido') };
  }
}
