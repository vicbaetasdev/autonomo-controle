# Autônomo Controle

MVP da versão gratuita do Autônomo Controle, a plataforma da equipe DevOracles pra gestão de profissionais autônomos e MEIs: agenda, clientes, financeiro e metas em um único lugar, transformando a rotina em indicadores de negócio.

Demo pensada pra rodar em qualquer lugar: front vanilla (HTML, CSS e JS puro, sem build) e uma API mockada que espelha os contratos que o app vai consumir no back-end real.

## Telas

Todas seguem o protótipo de alta fidelidade do Figma (dark mode, ciano e violeta, tipografia Inter):

O layout é responsivo de verdade: no desktop vira um painel com sidebar de navegação (mesmo shell da versão Pro IA do protótipo) e as telas se organizam em grid; no celular vira app com tab bar e botão flutuante.

- **Início**: total de vendas do mês, ticket médio, número de vendas, gráfico de receita dos últimos 30 dias e últimas transações
- **Agenda**: visão por dia com valor previsto, status de cada atendimento (aguardando, confirmado, concluído, cancelado) e horários livres destacados, prontos pra preencher
- **Novo agendamento**: marca o horário em segundos, com cliente nova direto no formulário; concluído já lança a entrada no financeiro
- **Financeiro**: saldo do mês, entradas, saídas por categoria, lançamentos recentes e o botão de lançar despesa no topo
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
  oracle.js         leitura e gravação no Oracle Autonomous Database (ORDS)
  config.js         endereço da API do Oracle
  app.js            telas, navegação, sheets e toasts
oracle/             scripts do banco e passo a passo (LEIA-ME.md)
api/                endpoints serverless de demonstração (fases anteriores)
```

### Dados no Oracle Autonomous Database

O banco está no ar no Oracle Autonomous Database (região São Paulo), e o endereço do ORDS está em `js/config.js`. Com `ORDS_BASE` preenchido, o app carrega as tabelas do Oracle ao abrir e grava cada alteração lá, pela API REST do ORDS. A regra "concluir o atendimento lança a entrada no financeiro" mora no banco (trigger), então vale para qualquer tela ou integração. Os dados de demonstração são recriados todo dia, sempre relativos à data de hoje.

| Rota no Oracle | O que faz |
| --- | --- |
| `/ords/autonomiza/{servicos,clientes,atendimentos,lancamentos,metas,tarefas}/` | REST automático das tabelas (GET, POST, PUT) |
| `/ords/autonomiza/app/saude` | rota de saúde para monitoramento |
| `/ords/autonomiza/app/resumo` | indicadores do mês calculados no banco |
| `/ords/autonomiza/app/demo/reiniciar` | recria os dados de demonstração (POST) |

Se o Oracle não responder, o app avisa e segue com os dados de demonstração do navegador. Sem `ORDS_BASE`, roda inteiro no navegador. Para apontar para outro banco sem mexer no código: `?ords=https://.../ords/autonomiza/`.

Os scripts e o passo a passo para criar o banco estão em [`oracle/`](oracle/LEIA-ME.md).

### Endpoints de demonstração (fases anteriores)

A pasta `api/` expõe os contratos REST usados na validação do produto, sem banco:

| Endpoint | Métodos | O que faz |
| --- | --- | --- |
| `/api/dashboard` | GET | indicadores do mês |
| `/api/appointments` | GET, POST, PATCH | agenda do dia, criar, mudar status |
| `/api/clients` | GET | lista com indicadores e histórico (`?id=`) |
| `/api/finance` | GET, POST | resumo do mês e lançamento de saídas |
| `/api/goals` | GET, PUT | metas e progresso |
| `/api/tasks` | POST, PATCH | tarefas do dia |
| `/api/services` | GET | catálogo de serviços |

O `store.js` é a única fonte das regras de cálculo: os endpoints importam dele, e com o Oracle ligado as telas continuam calculando por ele sobre os dados do banco.

## Deploy

Projeto pronto pra Vercel: importa o repositório e faz o deploy sem configuração (front estático + functions em `api/`). O app chama o ORDS do Oracle direto do navegador: o ORDS libera chamadas de outros domínios (CORS), então não é preciso repasse na Vercel, e o mesmo endereço funciona rodando local.

## Roadmap

- [x] Protótipo de alta fidelidade (Figma)
- [x] MVP navegável com back mockado
- [x] Dados no Oracle Autonomous Database com API REST pelo ORDS (camada Always Free)
- [ ] Painel administrativo no Oracle APEX
- [ ] Lembretes de confirmação automáticos
- [ ] Versão premium: IA Consultora (OCI AI Services) e WhatsApp integrado

---

Equipe DevOracles · Enterprise Challenge
