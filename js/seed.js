// gera a base de dados da demo em memoria
// seed deterministico: mesmo dia = mesmos dados, bom pra gravar video sem surpresa

export const pad = n => String(n).padStart(2, '0');
export const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseISO = s => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

let seed = 20260922;
const rnd = () => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
};
const pick = a => a[Math.floor(rnd() * a.length)];

const SERVICES = [
  { id: 1, name: 'Manicure', price: 30, dur: 45 },
  { id: 2, name: 'Alongamento', price: 120, dur: 120 },
  { id: 3, name: 'Esmaltação em gel', price: 50, dur: 60 },
  { id: 4, name: 'Manutenção', price: 60, dur: 75 },
  { id: 5, name: 'Spa dos pés', price: 45, dur: 40 },
];

const CLIENT_NAMES = ['Maria Silva', 'Ana Paula', 'Beatriz Lima', 'Camila Santos', 'Juliana Costa', 'Pedro Santos', 'Renata Lima', 'Carla Menezes', 'Fernanda Dias', 'Patrícia Rocha'];
const AV_COLORS = ['#8B5CF6', '#22D3EE', '#FBBF24', '#34D399', '#FB7185', '#6366F1', '#22D3EE', '#8B5CF6', '#34D399', '#FBBF24'];
const PAY = ['Pix', 'Pix', 'Pix', 'Dinheiro', 'Crédito', 'Débito'];
const HOURS = ['09:00', '10:30', '11:00', '13:00', '14:00', '15:30', '16:00', '17:00'];

export function buildDb(today) {
  seed = 20260922; // reseta pra ficar deterministico em qualquer import
  const TODAY = new Date(today);
  TODAY.setHours(0, 0, 0, 0);

  const db = {
    services: SERVICES.map(s => ({ ...s })),
    clients: CLIENT_NAMES.map((n, i) => ({
      id: i + 1, name: n, color: AV_COLORS[i],
      phone: `(91) 9${8000 + i * 111}-${1000 + i * 77}`,
      note: i === 0 ? 'Prefere tons nude, alergia a acetona pura.' : '',
    })),
    appointments: [],
    transactions: [],
    tasks: [
      { id: 1, label: 'Confirmar agenda de amanhã', done: true },
      { id: 2, label: 'Comprar esmaltes em gel', done: true },
      { id: 3, label: 'Responder orçamento da Beatriz', done: false },
      { id: 4, label: 'Postar fotos do alongamento', done: false },
      { id: 5, label: 'Separar recibos do mês', done: false },
    ],
    goals: { revenue: 6000, appts: 75 },
    nextAptId: 0,
    nextTxId: 0,
  };

  const addApt = (dateISO, time, clientId, serviceId, status, pay, price) => {
    const s = db.services.find(x => x.id === serviceId);
    const a = {
      id: ++db.nextAptId, date: dateISO, time, clientId, serviceId,
      dur: s.dur, price: price ?? s.price, status, pay: pay || pick(PAY), note: '',
    };
    db.appointments.push(a);
    return a;
  };
  const addTx = (dateISO, kind, label, cat, value, pay, aptId) => {
    db.transactions.push({ id: ++db.nextTxId, date: dateISO, kind, label, cat, value, pay: pay || '', aptId: aptId || null });
  };

  // historico das ultimas 10 semanas, terca a sabado
  // quarta de proposito mais vazia, igual ao estudo de caso da Mariana
  for (let off = 70; off >= 0; off--) {
    const d = new Date(TODAY);
    d.setDate(d.getDate() - off);
    const dow = d.getDay();
    if (dow === 0 || dow === 1) continue;
    const isPast = off > 0;
    // mes atual um pouco mais cheio, o negocio ta crescendo
    const boost = off <= 25 ? 1 : 0;
    const max = dow === 3 ? (rnd() < 0.5 ? 1 : 2) : (3 + boost + Math.floor(rnd() * 3));
    const hours = [...HOURS].sort(() => rnd() - 0.5).slice(0, max).sort();
    // as duas ultimas clientes so aparecem nas ultimas semanas (badge de nova)
    const pool = off > 21 ? db.clients.length - 2 : db.clients.length;
    for (const h of hours) {
      const cli = 1 + Math.floor(rnd() * pool);
      const svc = 1 + Math.floor(rnd() * db.services.length);
      if (isPast) {
        const st = rnd() < 0.9 ? 'concluido' : 'cancelado';
        const a = addApt(iso(d), h, cli, svc, st);
        if (st === 'concluido') addTx(a.date, 'in', db.clients[cli - 1].name, db.services[svc - 1].name, a.price, a.pay, a.id);
      } else {
        addApt(iso(d), h, cli, svc, rnd() < 0.6 ? 'confirmado' : 'agendado');
      }
    }
    if (isPast && dow === 6 && rnd() < 0.9) addTx(iso(d), 'out', 'Esmaltes e materiais', 'Material de trabalho', 60 + Math.floor(rnd() * 70), 'Pix');
    if (isPast && rnd() < 0.18) addTx(iso(d), 'out', 'Uber até a cliente', 'Transporte', 18 + Math.floor(rnd() * 30), 'Pix');
  }

  // proximos dias da semana ja com horario marcado
  for (let off = 1; off <= 4; off++) {
    const d = new Date(TODAY);
    d.setDate(d.getDate() + off);
    const dow = d.getDay();
    if (dow === 0 || dow === 1) continue;
    const hours = [...HOURS].sort(() => rnd() - 0.5).slice(0, dow === 3 ? 1 : 3).sort();
    for (const h of hours) {
      addApt(iso(d), h, 1 + Math.floor(rnd() * db.clients.length), 1 + Math.floor(rnd() * db.services.length), rnd() < 0.5 ? 'confirmado' : 'agendado');
    }
  }

  // despesas fixas do mes atual e do anterior
  for (const back of [0, 1]) {
    const d = new Date(TODAY.getFullYear(), TODAY.getMonth() - back, 5);
    if (d <= TODAY) addTx(iso(d), 'out', 'Aluguel do espaço', 'Aluguel do espaço', 550, 'Pix');
  }
  addTx(iso(TODAY), 'out', 'Outros gastos do mês', 'Outros', 48 + Math.floor(rnd() * 40), 'Dinheiro');

  return db;
}
