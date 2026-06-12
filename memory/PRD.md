# Gestor Financeiro — PRD

## Original Problem Statement (verbatim)
> Um gestor financeiro, feito em typescript, nodejs, postgress, Clean Architecture + Repository para proteger seus dados, use Strategy para organizar as lógicas matemáticas de taxas/juros e Observer para manter os painéis e saldos sempre atualizados.
>
> Faturamento: `id, name, type ("SALARY"|"AWARD"), value, createdAt, updatedAt`.
> Despesas: `id, name, type ("FIXED"|"CARD"|"DETACHED"), value, status ("PAID"|"PENDING"), createdAt, updatedAt`.
> Página inicial mensal/anual com boxes de Faturamento, Despesas e gráfico de gastos. Salários se repetem mensalmente (deletáveis em meses de férias). Fixas/Cartão sempre aparecem; Detached/Award só quando criados. Histórico permanente (ACID).

## Stack adaptada
- Frontend: React 19, TailwindCSS, shadcn/ui, Recharts, lucide-react, sonner
- Backend: FastAPI + Motor (async MongoDB driver)
- DB: MongoDB (ACID a nível de documento; queries scoped por `user_id`)
- Auth: Emergent-managed Google OAuth + allowlist (`ALLOWED_EMAILS=icaroomanuel@gmail.com`)

## Padrões arquiteturais
- Clean Architecture: `domain/` (entidades+enums+auth), `application/` (services + strategies + observers), `infrastructure/` (repositories), `interfaces/` (rotas em server.py)
- Repository: `BillingRepository`, `ExpenseRepository`, `RecurrenceSkipRepository`, `AuthRepository`
- Strategy: `SumValueStrategy`, `FilteredSumStrategy`, `CommittedPercentageStrategy`, `GroupByTypeStrategy`
- Observer: `EventHub` + `LoggingObserver` notificando `billing.*` / `expense.*`

## User Personas
- **Single user (Icaro Manuel)** — usuário único autorizado via allowlist; cada usuário tem dados totalmente isolados por `user_id`.

## Core Requirements (static)
1. CRUD de Faturamento (SALARY recorrente, AWARD avulso)
2. CRUD de Despesas (FIXED/CARD recorrentes, DETACHED avulso) com toggle PAID/PENDING
3. Recorrência por mês com skips (delete-month vs delete-all)
4. Resumo mensal: total entradas, saídas, saldo, % comprometido
5. Gráfico de barras por categoria (Fixa/Cartão/Avulsa) com % da renda
6. Navegação livre por mês/ano com histórico permanente
7. Auth Google + allowlist

## Implemented (Feb 2026)
- ✅ Backend Clean Architecture com Strategy + Observer + Repository
- ✅ Endpoints `/api/billings`, `/api/expenses`, `/api/summary` com escopo por user_id
- ✅ Recorrência mensal: `recurring=true` para SALARY/FIXED/CARD; skips por (user, kind, entity_id, year, month)
- ✅ `scope=month|all` em DELETE para diferenciar pular mês vs remover template
- ✅ Auth: `/api/auth/session`, `/api/auth/me`, `/api/auth/logout` (delete row + cookie) com allowlist por env
- ✅ Frontend: Dashboard com cards de resumo, gráfico de barras, listas, modais, seletor de mês/ano
- ✅ Login com Google + AuthCallback + ProtectedRoute + axios `withCredentials`
- ✅ 15/15 testes backend + todos os flows de frontend passando (testing agent iteration_1)

## Backlog
### P1
- Edição inline do template recorrente afeta meses futuros (hoje afeta global)
- Override por mês (editar valor do salário só em um mês específico)
- Exportar CSV/PDF do mês
- Notificações de despesas pendentes próximas do vencimento

### P2
- Categorias customizáveis (além de FIXED/CARD/DETACHED)
- Metas mensais (com observer notificando quando ultrapassa)
- Visão anual agregada
- Adicionar campo `interest_rate` e Strategy de juros para cartões

## Next Tasks
1. Definir comportamento de "edição de recorrente" (global vs override) e implementar overrides
2. Adicionar visão anual (gráfico de série temporal)
3. Adicionar export CSV
