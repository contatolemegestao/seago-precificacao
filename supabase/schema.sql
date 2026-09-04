-- ==============================================================================
-- SISTEMA SEAGO PRECIFICAÇÃO - SCHEMA SUPABASE / POSTGRESQL
-- ==============================================================================

-- Habilita extensão para UUIDs se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE PARÂMETROS GLOBAIS
CREATE TABLE IF NOT EXISTS public.parametros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kg_caixa NUMERIC(10,2) NOT NULL DEFAULT 16.0,
    enxarque_kg NUMERIC(10,2) NOT NULL DEFAULT 1.0,
    aliquota_imposto NUMERIC(5,2) NOT NULL DEFAULT 0.0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABELA DE CARGAS
CREATE TABLE IF NOT EXISTS public.cargas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero INTEGER UNIQUE NOT NULL,
    data_operacao DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'em_andamento', -- 'em_andamento', 'fechada'
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABELA DE MATÉRIA-PRIMA (LOTES DE CAMARÃO)
CREATE TABLE IF NOT EXISTS public.lotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    carga_id UUID NOT NULL REFERENCES public.cargas(id) ON DELETE CASCADE,
    numero_lote INTEGER NOT NULL,
    data DATE NOT NULL,
    fornecedor VARCHAR(150),
    classificacao VARCHAR(100), -- Ex: 'Camarão 60/70', 'Camarão 80/90'
    gr_inicial NUMERIC(10,4),
    gr_final NUMERIC(10,4),
    valor_compra_kg NUMERIC(12,4) NOT NULL,
    qtd_comprada NUMERIC(12,2) NOT NULL,
    qtd_final_medida NUMERIC(12,2), -- Pesagem de conferência real na balança
    valor_venda_kg NUMERIC(12,4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_lote_por_carga UNIQUE (carga_id, numero_lote)
);

-- 4. TABELA DE CUSTOS INDIRETOS (CIF / LOGÍSTICA)
CREATE TABLE IF NOT EXISTS public.cif_lancamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    carga_id UUID NOT NULL REFERENCES public.cargas(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    tipo_custo VARCHAR(150) NOT NULL, -- Ex: '1 - Frete - externo', '4 - Gelo Pesca', etc.
    qtd NUMERIC(14,4) NOT NULL,
    valor_unitario NUMERIC(14,4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilita Row Level Security (RLS)
ALTER TABLE public.parametros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cargas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cif_lancamentos ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso Público / Autenticado (Permitindo leitura e escrita)
CREATE POLICY "Permitir acesso total a parametros" ON public.parametros FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso total a cargas" ON public.cargas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso total a lotes" ON public.lotes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso total a cif_lancamentos" ON public.cif_lancamentos FOR ALL USING (true) WITH CHECK (true);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_parametros_updated_at BEFORE UPDATE ON public.parametros FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_cargas_updated_at BEFORE UPDATE ON public.cargas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_lotes_updated_at BEFORE UPDATE ON public.lotes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_cif_lancamentos_updated_at BEFORE UPDATE ON public.cif_lancamentos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
