// persistencia no Oracle Autonomous Database pelo ORDS (REST automatico das tabelas)
// o app carrega as tabelas na abertura e grava cada alteracao no banco; as telas
// continuam calculando os indicadores pelo store.js, entao nada nelas precisa mudar
// a regra "concluir lanca a entrada no financeiro" roda no banco (trigger), por isso
// depois de gravar um atendimento o app recarrega os lancamentos

import { ORDS_BASE } from './config.js';
import { db } from './store.js';

const AV_COLORS = ['#8B5CF6', '#22D3EE', '#FBBF24', '#34D399', '#FB7185', '#6366F1'];

const base = (() => {
  let b = '';
  try { b = new URLSearchParams(location.search).get('ords') || ''; } catch { /* sem location */ }
  b = (b || ORDS_BASE || '').trim();
  return b && !b.endsWith('/') ? `${b}/` : b;
})();

// modo: 'local' (dados do navegador), 'conectando' ou 'oracle'
export const status = { modo: base ? 'conectando' : 'local', erro: null };
const avisar = () => window.dispatchEvent(new CustomEvent('autonomiza:status', { detail: { ...status } }));
export const ativo = () => status.modo === 'oracle';

async function req(method, path, body) {
  console.log(`%c[oracle]%c ${method} ${path}`, 'color:#F80000;font-weight:bold', 'color:inherit');
  const r = await fetch(base + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(`${method} ${path}: HTTP ${r.status}`);
  const txt = await r.text();
  return txt ? JSON.parse(txt) : null;
}

// o ORDS pagina as colecoes; segue as paginas ate o fim
async function todos(alias) {
  const out = [];
  let offset = 0;
  for (;;) {
    const page = await req('GET', `${alias}/?limit=500&offset=${offset}`);
    const items = page?.items || [];
    out.push(...items);
    if (!page?.hasMore || !items.length) return out;
    offset += items.length;
  }
}

// DATE chega como 2026-11-23T00:00:00Z; o app trabalha com 2026-11-23
const dia = v => String(v || '').slice(0, 10);
const paraData = s => `${s}T00:00:00Z`;
const byId = (a, b) => a.id - b.id;

const MAPAS = {
  servicos: r => ({ id: r.id, name: r.nome, price: r.preco, dur: r.duracao_min }),
  clientes: r => ({ id: r.id, name: r.nome, phone: r.telefone || '', color: r.cor || AV_COLORS[r.id % AV_COLORS.length], note: r.observacao || '' }),
  atendimentos: r => ({
    id: r.id, date: dia(r.data_atendimento), time: r.hora, clientId: r.cliente_id, serviceId: r.servico_id,
    dur: r.duracao_min, price: r.valor, status: r.status, pay: r.forma_pagamento || '', note: r.observacao || '',
  }),
  lancamentos: r => ({
    id: r.id, date: dia(r.data_lancamento), kind: r.tipo === 'entrada' ? 'in' : 'out', label: r.descricao,
    cat: r.categoria, value: r.valor, pay: r.forma_pagamento || '', aptId: r.atendimento_id ?? null,
  }),
  tarefas: r => ({ id: r.id, label: r.descricao, done: r.concluida === 1 }),
  metas: r => ({ revenue: r.meta_faturamento, appts: r.meta_atendimentos }),
};
const DESTINO = {
  servicos: 'services', clientes: 'clients', atendimentos: 'appointments',
  lancamentos: 'transactions', tarefas: 'tasks', metas: 'goals',
};

// busca tudo primeiro e so depois troca os dados das telas, para nunca misturar
// metade do banco com metade da demonstracao
async function recarregar(...tabelas) {
  const lidas = await Promise.all(tabelas.map(async t => [t, (await todos(t)).map(MAPAS[t])]));
  for (const [t, linhas] of lidas) {
    if (t === 'metas') db.goals = linhas[0] || db.goals;
    else db[DESTINO[t]] = linhas.sort(byId);
  }
  db.nextAptId = Math.max(0, ...db.appointments.map(a => a.id));
  db.nextTxId = Math.max(0, ...db.transactions.map(t => t.id));
}

export async function iniciar() {
  if (!base) { avisar(); return status; }
  try {
    await recarregar(...Object.keys(MAPAS));
    status.modo = 'oracle';
  } catch (e) {
    console.warn('[oracle] sem conexao, seguindo com os dados do navegador', e);
    status.modo = 'local';
    status.erro = 'Sem conexão com o Oracle. Usando os dados de demonstração deste navegador.';
  }
  avisar();
  return status;
}

export function perdeuConexao(e) {
  console.warn('[oracle] falha ao gravar, a alteração ficou só neste navegador', e);
  status.modo = 'local';
  status.erro = 'O Oracle não respondeu. A alteração ficou só neste navegador.';
  avisar();
}

/* ------- gravacoes ------- */

const linhaAtendimento = a => ({
  id: a.id, data_atendimento: paraData(a.date), hora: a.time, cliente_id: a.clientId, servico_id: a.serviceId,
  duracao_min: a.dur, valor: a.price, status: a.status, forma_pagamento: a.pay || null, observacao: a.note || null,
});

export async function criarAtendimento(p) {
  let clienteId = p.clientId;
  if (!clienteId && p.newClient) {
    const cor = AV_COLORS[(db.clients.length + 1) % AV_COLORS.length];
    const novo = await req('POST', 'clientes/', { nome: p.newClient, cor });
    clienteId = novo?.id;
    if (!clienteId) {
      // se o ORDS nao devolver a linha criada, acha pela ultima cliente com esse nome
      await recarregar('clientes');
      clienteId = Math.max(...db.clients.filter(c => c.name === p.newClient).map(c => c.id));
    }
  }
  const s = db.services.find(x => x.id === p.serviceId);
  await req('POST', 'atendimentos/', {
    data_atendimento: paraData(p.date), hora: p.time, cliente_id: clienteId, servico_id: p.serviceId,
    duracao_min: p.dur || s.dur, valor: p.price ?? s.price, status: p.status,
    forma_pagamento: p.pay || null, observacao: p.note || null,
  });
  await recarregar('clientes', 'atendimentos', 'lancamentos');
}

export async function mudarStatus(id, novoStatus) {
  const a = db.appointments.find(x => x.id === id);
  if (!a) return;
  await req('PUT', `atendimentos/${id}`, linhaAtendimento({ ...a, status: novoStatus }));
  await recarregar('atendimentos', 'lancamentos');
}

export async function criarSaida(p) {
  await req('POST', 'lancamentos/', {
    data_lancamento: paraData(p.date), tipo: 'saida', descricao: p.label, categoria: p.cat,
    valor: p.value, forma_pagamento: p.pay || null,
  });
  await recarregar('lancamentos');
}

export async function salvarMetas(g) {
  const m = { ...db.goals, ...g };
  await req('PUT', 'metas/1', { id: 1, meta_faturamento: m.revenue, meta_atendimentos: m.appts });
  await recarregar('metas');
}

export async function alternarTarefa(id) {
  const t = db.tasks.find(x => x.id === id);
  if (!t) return;
  await req('PUT', `tarefas/${id}`, { id, descricao: t.label, concluida: t.done ? 0 : 1 });
  await recarregar('tarefas');
}

export async function novaTarefa(label) {
  await req('POST', 'tarefas/', { descricao: label, concluida: 0 });
  await recarregar('tarefas');
}
