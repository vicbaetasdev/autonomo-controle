// camada de servico que as telas consomem
// com o Oracle configurado (js/config.js), os dados vem do Autonomous Database e cada
// alteracao e gravada la; sem ele, tudo roda no store local com os dados de demonstracao
// as leituras sempre saem do store.js, que e a unica fonte das regras de calculo

import * as store from './store.js';
import * as oracle from './oracle.js';

// as telas esperam o carregamento inicial antes da primeira leitura
export const ready = oracle.iniciar();

// latencia simulada so no modo local, pra UI se comportar como com rede de verdade
const sleep = () => new Promise(r => setTimeout(r, 150 + Math.random() * 250));

async function ler(local) {
  await ready;
  if (!oracle.ativo()) await sleep();
  return local();
}

async function gravar(local, remoto) {
  await ready;
  if (oracle.ativo()) {
    try {
      return await remoto();
    } catch (e) {
      oracle.perdeuConexao(e);
    }
  }
  return local();
}

export const api = {
  getServices: () => ler(() => store.listServices()),
  getClients: () => ler(() => store.listClients()),
  getClientHistory: id => ler(() => store.clientHistory(id)),
  getAgenda: date => ler(() => store.agendaDo(date)),
  getFinance: ym => ler(() => store.finance(ym)),
  getDashboard: () => ler(() => store.dashboard()),
  getGoals: () => ler(() => store.goalsState()),
  createAppointment: p => gravar(() => store.createAppointment(p), () => oracle.criarAtendimento(p)),
  setAppointmentStatus: (id, status) => gravar(() => store.setAppointmentStatus(id, status), () => oracle.mudarStatus(id, status)),
  createExpense: p => gravar(() => store.createExpense(p), () => oracle.criarSaida(p)),
  setGoals: g => gravar(() => store.setGoals(g), () => oracle.salvarMetas(g)),
  toggleTask: id => gravar(() => store.toggleTask(id), () => oracle.alternarTarefa(id)),
  addTask: label => gravar(() => store.addTask(label), () => oracle.novaTarefa(label)),
};
