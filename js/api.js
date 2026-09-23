// camada de servico que as telas consomem
// por padrao resolve tudo no store local (a demo precisa manter estado
// entre as interacoes, e serverless sem banco nao guarda nada entre requests)
// USE_API=true passa as leituras pros endpoints de /api, que espelham
// exatamente os mesmos contratos

import * as store from './store.js';

const USE_API = false;

const sleep = () => new Promise(r => setTimeout(r, 150 + Math.random() * 250));

async function call(method, path, local) {
  await sleep(); // latencia simulada pra UI se comportar como com rede de verdade
  console.log(`%c[api]%c ${method} ${path}`, 'color:#22D3EE;font-weight:bold', 'color:inherit');
  if (USE_API && method === 'GET') {
    try {
      const r = await fetch(path);
      if (r.ok) return await r.json();
    } catch {
      // sem rede ou rodando local sem as functions, cai pro store
    }
  }
  return local();
}

export const api = {
  getServices: () => call('GET', '/api/services', () => store.listServices()),
  getClients: () => call('GET', '/api/clients', () => store.listClients()),
  getClientHistory: id => call('GET', `/api/clients?id=${id}`, () => store.clientHistory(id)),
  getAgenda: date => call('GET', `/api/appointments?date=${date}`, () => store.agendaDo(date)),
  createAppointment: p => call('POST', '/api/appointments', () => store.createAppointment(p)),
  setAppointmentStatus: (id, status) => call('PATCH', `/api/appointments?id=${id}`, () => store.setAppointmentStatus(id, status)),
  getFinance: ym => call('GET', `/api/finance?month=${ym}`, () => store.finance(ym)),
  createExpense: p => call('POST', '/api/finance', () => store.createExpense(p)),
  getDashboard: () => call('GET', '/api/dashboard', () => store.dashboard()),
  getGoals: () => call('GET', '/api/goals', () => store.goalsState()),
  setGoals: g => call('PUT', '/api/goals', () => store.setGoals(g)),
  toggleTask: id => call('PATCH', `/api/tasks?id=${id}`, () => store.toggleTask(id)),
  addTask: label => call('POST', '/api/tasks', () => store.addTask(label)),
};
