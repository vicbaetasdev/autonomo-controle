# Autônomo Controle

MVP da versão gratuita do Autônomo Controle, a plataforma da equipe DevOracles pra gestão de profissionais autônomos e MEIs: agenda, clientes, financeiro e metas em um único lugar, transformando a rotina em indicadores de negócio.

Demo pensada pra rodar em qualquer lugar: front vanilla (HTML, CSS e JS puro, sem build) e uma API mockada que espelha os contratos que o app vai consumir no back-end real.

## Telas

Todas seguem o protótipo de alta fidelidade do Figma (dark mode, ciano e violeta, tipografia Inter):

O layout é responsivo de verdade: no desktop vira um painel com sidebar de navegação (mesmo shell da versão Pro IA do protótipo) e as telas se organizam em grid; no celular vira app com tab bar e botão flutuante.

- **Início**: total de vendas do mês, ticket médio, número de vendas, gráfico de receita dos últimos 30 dias e últimas transações
- **Agenda**: visão por dia com valor previsto, status de cada atendimento (aguardando, confirmado, concluído, cancelado) e horários livres destacados, prontos pra preencher
- **Novo Serviço**: cadastro em segundos; concluído já lança a entrada no financeiro
- **Financeiro**: saldo do mês, entradas, saídas por categoria e lançamentos recentes
- **Clientes**: busca, filtros (frequentes, novas, sem retorno), badges de fidelidade e histórico por cliente
- **Metas & Tarefas**: progresso de faturamento e atendimentos calculado dos dados reais da demo, mais checklist do dia

## Como rodar

Sem dependências. Qualquer servidor estático resolve:

```bash
npx serve .
# ou
python3 -m http.server 3000
```

Abre `http://localhost:3000` e pronto. Pra rodar também as functions da API: `npx vercel dev`.

## Arquitetura

```
index.html          casca do app
styles.css          design system (tokens do Figma)
js/
  seed.js           gera a base de dados da demo (determinística)
  store.js          regras de negócio e consultas em memória
  api.js            camada de serviço que as telas consomem
  app.js            telas, navegação, sheets e toasts
api/                endpoints serverless (Vercel), mesmos contratos do store
```

### Back-end mockado

O back ainda não usa banco de propósito: nesta fase o objetivo é validar produto, não infraestrutura. A pasta `api/` expõe os endpoints REST que o front vai consumir na versão final:

| Endpoint | Métodos | O que faz |
| --- | --- | --- |
| `/api/dashboard` | GET | indicadores do mês |
| `/api/appointments` | GET, POST, PATCH | agenda do dia, criar, mudar status |
| `/api/clients` | GET | lista com indicadores e histórico (`?id=`) |
| `/api/finance` | GET, POST | resumo do mês e lançamento de saídas |
| `/api/goals` | GET, PUT | metas e progresso |
| `/api/tasks` | POST, PATCH | tarefas do dia |
| `/api/services` | GET | catálogo de serviços |

Como serverless sem banco não guarda estado entre requests, a demo resolve as interações no store local do navegador (`js/api.js`, flag `USE_API`). O `store.js` é a única fonte de regras: os endpoints importam dele, então front e API nunca divergem.

Na versão final, a mesma camada `api.js` passa a apontar pros endpoints do Oracle ORDS/APEX, com os dados no Autonomous Database. Nada nas telas precisa mudar.

## Deploy

Projeto pronto pra Vercel: importa o repositório e faz o deploy sem configuração (front estático + functions em `api/`).

## Roadmap

- [x] Protótipo de alta fidelidade (Figma)
- [x] MVP navegável com back mockado
- [ ] Back-end real: Oracle APEX + ORDS + Autonomous Database (camada Always Free)
- [ ] Lembretes de confirmação automáticos
- [ ] Versão premium: IA Consultora (OCI AI Services) e WhatsApp integrado

---

Equipe DevOracles · Enterprise Challenge
