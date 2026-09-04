# 🦐 SeaGO · Sistema de Precificação e Resultado Operacional

Sistema profissional para cálculo de precificação, controle de lotes de matéria-prima (camarão), custos indiretos (CIF/logística), enxarque e DRE consolidado.

Construído com **React + TypeScript + Tailwind CSS**, integrado ao **Supabase (PostgreSQL)** para persistência em tempo real e preparado para deploy na **Vercel** via **GitHub**.

---

## 🚀 Como Colocar no Ar (Passo a Passo)

### 1️⃣ Configurar o Banco de Dados no Supabase

1. Acesse [supabase.com](https://supabase.com) e faça login (ou crie sua conta gratuita).
2. Clique em **"New Project"**, defina um nome (ex: `seago-precificacao`) e crie uma senha para o banco de dados.
3. No menu lateral esquerdo, vá em **SQL Editor**.
4. Abra o arquivo `supabase/schema.sql` deste projeto, copie todo o código e cole no SQL Editor do Supabase. Clique em **Run**.
5. Em seguida, abra o arquivo `supabase/seed.sql`, copie o conteúdo (que contém os dados históricos das cargas 1 a 6), cole e clique em **Run**.
6. Vá em **Project Settings > API** e copie:
   - **Project URL**
   - **anon public key**

---

### 2️⃣ Subir o Código no GitHub

1. No seu computador, dentro da pasta `seago-app`:
```bash
git init
git add .
git commit -m "feat: initial commit sistema seago precificacao"
```
2. Crie um novo repositório no seu GitHub (ex: `seago-precificacao`).
3. Conecte o repositório remoto e envie o código:
```bash
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/seago-precificacao.git
git push -u origin main
```

---

### 3️⃣ Fazer o Deploy na Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login com seu GitHub.
2. Clique em **"Add New..." > "Project"**.
3. Localize e importe o repositório `seago-precificacao`.
4. Em **Environment Variables**, adicione as variáveis do Supabase copiadas no passo 1:
   - `VITE_SUPABASE_URL`: `https://seu-projeto.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `sua-chave-anon-publica`
5. Clique em **Deploy**! Em menos de 1 minuto, seu sistema estará online com link seguro `https://seago-precificacao.vercel.app` (e pronto para adicionar domínio customizado).

---

## 💻 Como Rodar Localmente no Computador

1. Instale as dependências:
```bash
npm install
```

2. Crie o arquivo `.env` baseado no `.env.example`:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

Abra `http://localhost:5173` no seu navegador.

---

## 📊 Regras de Negócio e Cálculos

- **Enxarque:** 
  - `Caixas = Qtd Comprada (kg) / 16 kg`
  - `Enxarque (kg) = Caixas × 1.0 kg`
  - `Qtd Vendida (kg) = Qtd Comprada + Enxarque`
- **DRE Operacional:**
  - `Faturamento = Σ (Qtd Vendida × Preço Venda)`
  - `Custo MP = Σ (Qtd Comprada × Preço Compra)`
  - `CIF = Σ (Qtd × Valor Unitário)`
  - `Lucro Operacional = Faturamento - Custo MP - CIF - Impostos`
- **Custo Logístico por kg:**
  - `CIF Integral / kg Vendido = CIF Total / Qtd Vendida`
  - `Custo Logístico Líquido = (CIF Total - Receita do Enxarque) / Qtd Vendida`
