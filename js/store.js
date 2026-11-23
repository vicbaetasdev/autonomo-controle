// regras de negocio e consultas sobre o banco em memoria
// os contratos daqui sao os mesmos expostos em /api, entao quando o back
// real (ORDS/APEX) existir e so trocar a implementacao mantendo as assinaturas

import { buildDb, iso, parseISO, pad } from './seed.js';

export const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

export const db = buildDb(TODAY);

const AV_COLORS = ['#8B5CF6', '#22D3EE', '#FBBF24', '#34D399', '#FB7185', '#6366F1'];
const cliName = id => (db.clients.find(c => c.id === id) || {}).name || 'Cliente';
const svcName = id => (db.services.find(s => s.id === id) || {}).name || 'Serviço';
const monthOf = s => s.slice(0, 7);

function addTx(dateISO, kind, label, cat, value, pay, aptId) {
  db.transactions.push({ id: ++db.nextTxId, date: dateISO, kind, label, cat, value, pay: pay || '', aptId: aptId || null });
}

export function listServices() {
  return structuredClone(db.services);
}

export function listClients() {
  return db.clients.map(c => {
    const done = db.appointments.filter(a => a.clientId === c.id && a.status === 'concluido');
    const all = db.appointments.filter(a => a.clientId === c.id && a.status !== 'cancelado');
    const last = done.map(a => a.date).sort().at(-1) || null;
    const first = all.map(a => a.date).sort()[0] || null;
    const spent = done.reduce((s, a) => s + a.price, 0);
    const daysSince = last ? Math.round((TODAY - parseISO(last)) / 864e5) : null;
    const daysFirst = first ? Math.round((TODAY - parseISO(first)) / 864e5) : null;
    return {
      ...c, visits: done.length, last, spent,
      fiel: done.length >= 14,
      nova: daysFirst !== null && daysFirst <= 21,
      semRetorno: daysSince !== null && daysSince > 30,
    };
  });
}

export function clientHistory(id) {
  return db.appointments
    .filter(a => a.clientId === id)
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
    .slice(0, 12)
    .map(a => ({ ...a, service: svcName(a.serviceId) }));
}

export function agendaDo(dateISO) {
  const list = db.appointments
    .filter(a => a.date === dateISO)
    .sort((a, b) => a.time.localeCompare(b.time))
    .map(a => ({ ...a, client: cliName(a.clientId), service: svcName(a.serviceId) }));
  const expected = list.filter(a => a.status !== 'cancelado').reduce((s, a) => s + a.price, 0);
  return { list, expected, count: list.filter(a => a.status !== 'cancelado').length };
}

export function createAppointment(p) {
  let clientId = p.clientId;
  if (!clientId && p.newClient) {
    clientId = Math.max(0, ...db.clients.map(c => c.id)) + 1;
    db.clients.push({ id: clientId, name: p.newClient, color: AV_COLORS[clientId % AV_COLORS.length], phone: '', note: '' });
  }
  const s = db.services.find(x => x.id === p.serviceId);
  const a = {
    id: ++db.nextAptId, date: p.date, time: p.time, clientId, serviceId: p.serviceId,
    dur: p.dur || s.dur, price: p.price ?? s.price, status: p.status, pay: p.pay, note: p.note || '',
  };
  db.appointments.push(a);
  if (p.status === 'concluido') addTx(a.date, 'in', cliName(clientId), svcName(p.serviceId), a.price, a.pay, a.id);
  return { ...a };
}

export function setAppointmentStatus(id, status) {
  const a = db.appointments.find(x => x.id === id);
  if (!a) return null;
  const had = db.transactions.find(t => t.aptId === id);
  a.status = status;
  // concluir lanca a entrada; desfazer a conclusao remove o lancamento
  if (status === 'concluido' && !had) addTx(a.date, 'in', cliName(a.clientId), svcName(a.serviceId), a.price, a.pay, a.id);
  if (status !== 'concluido' && had) db.transactions = db.transactions.filter(t => t.aptId !== id);
  return { ...a };
}

export function finance(ym) {
  const tx = db.transactions
    .filter(t => monthOf(t.date) === ym)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  const inn = tx.filter(t => t.kind === 'in').reduce((s, t) => s + t.value, 0);
  const out = tx.filter(t => t.kind === 'out').reduce((s, t) => s + t.value, 0);
  const cats = {};
  tx.filter(t => t.kind === 'out').forEach(t => { cats[t.cat] = (cats[t.cat] || 0) + t.value; });
  return { tx, in: inn, out, saldo: inn - out, cats };
}

export function createExpense(p) {
  addTx(p.date, 'out', p.label, p.cat, p.value, p.pay);
  return true;
}

export function dashboard() {
  const ym = iso(TODAY).slice(0, 7);
  const prev = new Date(TODAY.getFullYear(), TODAY.getMonth() - 1, 1);
  const ymPrev = iso(prev).slice(0, 7);
  const cutPrev = `${ymPrev}-${pad(TODAY.getDate())}`;
  const sales = db.transactions.filter(t => t.kind === 'in' && monthOf(t.date) === ym);
  // compara com o mes passado ate o mesmo dia, senao o delta engana
  const prevSales = db.transactions.filter(t => t.kind === 'in' && monthOf(t.date) === ymPrev && t.date <= cutPrev);
  const total = sales.reduce((s, t) => s + t.value, 0);
  const prevTotal = prevSales.reduce((s, t) => s + t.value, 0);
  const delta = prevTotal ? (total - prevTotal) / prevTotal * 100 : 0;
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(TODAY);
    d.setDate(d.getDate() - i);
    const k = iso(d);
    days.push({ date: k, v: db.transactions.filter(t => t.kind === 'in' && t.date === k).reduce((s, t) => s + t.value, 0) });
  }
  const weekNew = sales.filter(t => (TODAY - parseISO(t.date)) / 864e5 < 7).length;
  return {
    total, delta, count: sales.length,
    ticket: sales.length ? total / sales.length : 0,
    days, weekNew,
    recent: db.transactions.slice().sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id).slice(0, 4),
  };
}

export function goalsState() {
  const ym = iso(TODAY).slice(0, 7);
  const sales = db.transactions.filter(t => t.kind === 'in' && monthOf(t.date) === ym);
  const rev = sales.reduce((s, t) => s + t.value, 0);
  const weekCount = sales.filter(t => (TODAY - parseISO(t.date)) / 864e5 < 7).length;
  const daysLeft = new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 0).getDate() - TODAY.getDate();
  const dayAvg = rev / Math.max(1, TODAY.getDate());
  return { ...db.goals, rev, count: sales.length, weekCount, proj: rev + dayAvg * daysLeft, tasks: structuredClone(db.tasks) };
}

export function setGoals(g) {
  Object.assign(db.goals, g);
  return { ...db.goals };
}

export function toggleTask(id) {
  const t = db.tasks.find(x => x.id === id);
  if (t) t.done = !t.done;
  return { ...t };
}

export function addTask(label) {
  const t = { id: db.tasks.length + 1 + Math.floor(Math.random() * 999), label, done: false };
  db.tasks.push(t);
  return { ...t };
}
