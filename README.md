# NutriCurvas – App de Avaliação de Crescimento OMS

App web Next.js 14 com Supabase (banco de dados) e deploy via Vercel.

## Stack
- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** (estilo)
- **Supabase** (banco de dados PostgreSQL)
- **Recharts** (gráficos de curvas)
- **Vercel** (deploy)

## Banco de dados (já criado)
- Projeto Supabase: `app-nutricao` (sa-east-1)
- Tabelas: `pacientes` e `medicoes`
- IMC calculado automaticamente pelo banco

## Rodar localmente

```bash
# 1. Instalar dependências
npm install

# 2. Variáveis de ambiente (já configuradas no .env.local)
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# 3. Rodar
npm run dev
# Acesse http://localhost:3000
```

## Deploy no Vercel

### Opção A – Via GitHub (recomendado)

1. Crie um repositório no GitHub e suba o código:
```bash
git init
git add .
git commit -m "feat: app nutricurvas inicial"
git remote add origin https://github.com/SEU_USUARIO/app-nutricao.git
git push -u origin main
```

2. Acesse **vercel.com**, clique em **Add New Project**
3. Importe o repositório do GitHub
4. Na tela de configuração, adicione as **variáveis de ambiente**:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://enwsdhsrldsxibugdlhq.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (a chave anon do .env.local)
5. Clique em **Deploy** — pronto!

A cada `git push`, o Vercel faz o deploy automaticamente.

## Funcionalidades
- Cadastro de pacientes (nome, nascimento, sexo)
- Registro de medições (peso, altura, data)
- IMC calculado automaticamente
- Classificação percentílica (P3, P15, P50, P85, P97) para IMC, Peso e Altura
- Gráficos com curvas OMS sobrepostas ao histórico do paciente
- Granularidade mensal (0–24 meses) e anual (2–19 anos)
- Histórico de medições em tabela

## Segurança (próximos passos)
- Atualmente o banco usa RLS com política pública (development mode)
- Para produção: adicionar autenticação Supabase Auth e restringir RLS por usuário
