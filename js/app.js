// shell do app: navegacao, telas, sheets e toasts
// tudo vanilla mesmo, sem framework, pra demo carregar em qualquer lugar

import { api } from './api.js';
import { db, TODAY } from './store.js';
import { iso, pad, parseISO } from './seed.js';

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const fmt = v => BRL.format(v);
const fmtK = v => BRL.format(v).replace(',00', '');
const DOW = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const DOW_FULL = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

/* ------- icones (svg inline pra nao depender de lib) ------- */
const I = {
  spark: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2l2.2 6.6L21 11l-6.8 2.4L12 20l-2.2-6.6L3 11l6.8-2.4z"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="16" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/></svg>',
  wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="6" width="18" height="14" rx="3"/><path d="M3 10h18"/><path d="M15.5 15h2"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="9" cy="8.5" r="3.5"/><path d="M2.5 20c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5"/><circle cx="17" cy="9.5" r="2.6"/><path d="M16.4 15.2c2.6.3 4.4 1.9 5.1 4.3"/></svg>',
  target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.8"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  x: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5l5 5 10-11"/></svg>',
  search: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.8-3.8"/></svg>',
  bell: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 10a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M10.5 20a1.7 1.7 0 0 0 3 0"/></svg>',
  up: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 15l7-7 7 7"/></svg>',
  down: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 9l7 7 7-7"/></svg>',
  clock: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  heart: '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M12 20.5S4 15.3 4 9.9A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8 2.9c0 5.4-8 10.6-8 10.6z"/></svg>',
};

/* ------- shell ------- */
const TABS = [
  { id: 'inicio', label: 'Início', icon: I.home },
  { id: 'agenda', label: 'Agenda', icon: I.cal },
  { id: 'financeiro', label: 'Financeiro', icon: I.wallet },
  { id: 'clientes', label: 'Clientes', icon: I.users },
  { id: 'metas', label: 'Metas', icon: I.target },
];
const $screens = document.getElementById('screens');
const $tabbar = document.getElementById('tabbar');
const $fab = document.getElementById('fab');
const $sheet = document.getElementById('sheet');
const $backdrop = document.getElementById('backdrop');
const $toast = document.getElementById('toast');
const state = { tab: 'inicio', agendaDate: iso(TODAY), weekOffset: 0, cliFilter: 'todas', cliQuery: '' };

$fab.innerHTML = I.plus;
$tabbar.innerHTML = TABS.map(t => `<button data-tab="${t.id}" aria-current="${t.id === state.tab}">${t.icon}<span>${t.label}</span></button>`).join('');
$tabbar.addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) go(b.dataset.tab); });
const $sidenav = document.getElementById('sidenav');
$sidenav.innerHTML = TABS.map(t => `<button data-tab="${t.id}" aria-current="${t.id === state.tab}">${t.icon}<span>${t.label}</span></button>`).join('');
$sidenav.addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) go(b.dataset.tab); });
document.getElementById('side-new').onclick = () => openNovoServico();
document.getElementById('side-mark').innerHTML = I.spark;
document.getElementById('pro-teaser').onclick = () => toast('A IA Consultora chega no plano Pro 😉');
$fab.addEventListener('click', () => openNovoServico());
$backdrop.addEventListener('click', closeSheet);

function go(tab) {
  state.tab = tab;
  document.querySelectorAll('#tabbar [data-tab], #sidenav [data-tab]').forEach(b => b.setAttribute('aria-current', b.dataset.tab === tab));
  render();
}
function head() {
  return `<div class="apphead">
    <div class="brand"><div class="mark">${I.spark}</div><div><div class="n1">Autônomo</div><div class="n2">Controle</div></div></div>
    <button class="avatar" aria-label="Perfil de Mariana">M</button></div>`;
}
let toastTimer;
function toast(msg) {
  $toast.innerHTML = `<span class="tk">${I.check}</span><span>${msg}</span>`;
  $toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $toast.hidden = true; }, 2600);
}
function openSheet(html) {
  $sheet.innerHTML = html;
  $sheet.hidden = false;
  $backdrop.hidden = false;
  $sheet.querySelector('.x')?.focus();
}
function closeSheet() {
  $sheet.hidden = true;
  $backdrop.hidden = true;
}
function sheetHead(t) {
  return `<div class="sheet-handle"></div><div class="sheet-head"><div class="h-title">${t}</div><button class="x" aria-label="Fechar" data-close>${I.x}</button></div>`;
}
$sheet.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeSheet(); });
const skel = h => `<div class="skel" style="height:${h}px"></div>`;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
function countUps() {
  $screens.querySelectorAll('[data-count]').forEach(el => {
    const target = +el.dataset.count;
    if (reduceMotion) { el.textContent = fmt(target); return; }
    const t0 = performance.now(), dur = 650;
    const tick = now => {
      const k = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3); // easing pra desacelerar no final
      el.textContent = fmt(target * e);
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}
function animateTracks() {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    $screens.querySelectorAll('[data-w]').forEach(el => { el.style.width = el.dataset.w; });
  }));
}

/* ------- inicio ------- */
async function renderInicio() {
  $screens.innerHTML = `<section data-screen="inicio">${head()}
    <div class="blk-head"><div class="h-display">Olá, Mariana 👋</div><div class="h-sub">Últimos 30 dias · seu negócio em um olhar</div></div>
    ${skel(150)}${skel(84)}${skel(180)}${skel(200)}</section>`;
  const d = await api.getDashboard();
  if (state.tab !== 'inicio') return;
  const deltaCls = d.delta >= 0 ? 'pos' : 'neg';
  const deltaTxt = `${d.delta >= 0 ? '↗ +' : '↘ '}${d.delta.toFixed(1).replace('.', ',')}%`;
  $screens.innerHTML = `<section data-screen="inicio">${head()}
    <div class="blk-head"><div class="h-display">Olá, Mariana 👋</div><div class="h-sub">Últimos 30 dias · seu negócio em um olhar</div></div>
    <div class="card hero blk-hero">
      <div class="rowhead"><span class="metric-label">Total de Vendas</span>
        <span class="chip ${d.delta >= 0 ? 'ok' : 'off'}">${deltaTxt}</span></div>
      <div class="metric" data-count="${d.total}">${fmt(0)}</div>
      <div class="metric-note" style="color:var(--muted);font-weight:500">${d.count} vendas · ticket médio ${fmt(d.ticket)}</div>
      <div class="chart-wrap">${sparkline(d.days)}</div>
    </div>
    <div class="tiles blk-tiles">
      <div class="tile"><div class="t"><span class="dot" style="background:var(--cyan)"></span>Ticket Médio</div>
        <div class="v">${fmt(d.ticket)}</div><div class="s ${deltaCls}">${d.delta >= 0 ? '+' : ''}${d.delta.toFixed(1).replace('.', ',')}% vs mês passado</div></div>
      <div class="tile"><div class="t"><span class="dot" style="background:var(--violet)"></span>Nº de Vendas</div>
        <div class="v">${d.count}</div><div class="s" style="color:var(--muted)">${d.weekNew} novas nesta semana</div></div>
    </div>
    <div class="card blk-chart">
      <div class="rowhead"><span class="h-title">Visão Geral de Receita</span><span class="chip neutral">Últimos 30 dias</span></div>
      <div class="chart-wrap">${barChart(d.days)}</div>
    </div>
    <div class="card blk-tx">
      <div class="rowhead"><span class="h-title">Últimas Transações</span>
        <button class="link" data-goto="financeiro">Ver tudo</button></div>
      <div>${d.recent.map(txRow).join('')}</div>
    </div></section>`;
  $screens.querySelector('[data-goto]').onclick = () => go('financeiro');
  countUps();
  bindChartTip();
}
function bindChartTip() {
  const tip = document.getElementById('chart-tip');
  const wrap = $screens.querySelector('.blk-chart');
  if (!wrap) return;
  wrap.addEventListener('pointermove', e => {
    const r = e.target.closest('rect[data-v]');
    if (!r) { tip.hidden = true; return; }
    tip.textContent = `${r.dataset.d} · ${fmt(+r.dataset.v)}`;
    tip.hidden = false;
    tip.style.left = `${Math.min(e.clientX + 14, innerWidth - 150)}px`;
    tip.style.top = `${e.clientY - 38}px`;
  });
  wrap.addEventListener('pointerleave', () => { tip.hidden = true; });
}
function txRow(t) {
  const inn = t.kind === 'in';
  const d = parseISO(t.date);
  const when = t.date === iso(TODAY) ? 'Hoje' : `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
  return `<div class="tx">
    <div class="ic ${inn ? 'in' : 'out'}">${inn ? I.up : I.down}</div>
    <div><div class="n">${t.label}</div><div class="c">${when}${t.pay ? ' · ' + t.pay : ''}${!inn ? ' · ' + t.cat : ''}</div></div>
    <div class="val"><div class="v ${inn ? 'pos' : 'neg'}">${inn ? '+ ' : '− '}${fmt(t.value)}</div></div>
  </div>`;
}
function sparkline(days) {
  const w = 320, h = 64, p = 4;
  let acc = 0;
  const cum = days.map(d => acc += d.v);
  const max = Math.max(...cum, 1);
  const pts = cum.map((v, i) => [p + i * (w - 2 * p) / (days.length - 1), h - p - (v / max) * (h - 2 * p)]);
  const line = pts.map((pt, i) => `${i ? 'L' : 'M'}${pt[0].toFixed(1)},${pt[1].toFixed(1)}`).join('');
  const area = line + `L${pts.at(-1)[0].toFixed(1)},${h}L${pts[0][0].toFixed(1)},${h}Z`;
  const end = pts.at(-1);
  return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Receita acumulada dos últimos 30 dias">
    <defs><linearGradient id="sg" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#22D3EE"/><stop offset="1" stop-color="#8B5CF6"/></linearGradient>
    <linearGradient id="sa" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="rgba(99,102,241,.28)"/><stop offset="1" stop-color="rgba(99,102,241,0)"/></linearGradient>
    <filter id="sblur" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="2.6"/></filter></defs>
    <path d="${area}" fill="url(#sa)"/>
    <path d="${line}" fill="none" stroke="url(#sg)" stroke-width="4" stroke-linecap="round" opacity=".35" filter="url(#sblur)"/>
    <path d="${line}" fill="none" stroke="url(#sg)" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="${end[0].toFixed(1)}" cy="${end[1].toFixed(1)}" r="8" fill="rgba(139,92,246,.22)"/>
    <circle cx="${end[0].toFixed(1)}" cy="${end[1].toFixed(1)}" r="3.4" fill="#8B5CF6" stroke="#F1F5FE" stroke-width="1.4"/></svg>`;
}
function barChart(days) {
  const w = 340, h = 120, bt = 14, bb = 18;
  const max = Math.max(...days.map(d => d.v), 1);
  const bw = w / days.length;
  const gy = f => bt + (1 - f) * (h - bt - bb);
  const grid = [0.33, 0.66].map(f =>
    `<line x1="0" x2="${w}" y1="${gy(f).toFixed(1)}" y2="${gy(f).toFixed(1)}" stroke="rgba(140,163,203,.13)" stroke-dasharray="3 5"/>`).join('');
  const bars = days.map((d, i) => {
    const bh = Math.max(2, (d.v / max) * (h - bt - bb));
    const dd = parseISO(d.date);
    return `<rect x="${(i * bw + 1.5).toFixed(1)}" y="${(h - bb - bh).toFixed(1)}" width="${(bw - 3).toFixed(1)}" height="${bh.toFixed(1)}" rx="2.5" fill="url(#bg1)" opacity="${d.v ? '.95' : '.18'}" data-v="${d.v}" data-d="${pad(dd.getDate())}/${pad(dd.getMonth() + 1)}"/>`;
  }).join('');
  const labels = [0, 7, 14, 21, 29].map(i => {
    const d = parseISO(days[i].date);
    return `<text x="${(i * bw + bw / 2).toFixed(1)}" y="${h - 4}" font-size="9.5" fill="#5E7299" text-anchor="middle" font-family="Inter,sans-serif">${pad(d.getDate())}/${pad(d.getMonth() + 1)}</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Receita por dia nos últimos 30 dias">
    <defs><linearGradient id="bg1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#22D3EE"/><stop offset="1" stop-color="#8B5CF6"/></linearGradient></defs>
    <text x="2" y="${bt - 4}" font-size="9.5" fill="#5E7299" font-family="Inter,sans-serif">máx ${fmtK(max)}/dia</text>
    ${grid}${bars}${labels}</svg>`;
}

/* ------- agenda ------- */
async function renderAgenda() {
  const sel = parseISO(state.agendaDate);
  const sub = `${DOW_FULL[sel.getDay()].replace(/^./, c => c.toUpperCase())}, ${sel.getDate()} de ${MESES[sel.getMonth()]}`;
  $screens.innerHTML = `<section data-screen="agenda">${head()}
    <div class="blk-head"><div class="h-display">Agenda</div><div class="h-sub">${sub}</div></div>
    ${weekStrip()}${skel(40)}${skel(70)}${skel(70)}${skel(70)}</section>`;
  bindWeek();
  const { list, expected, count } = await api.getAgenda(state.agendaDate);
  if (state.tab !== 'agenda') return;
  const rowsHtml = agendaRows(list);
  const freeCount = (rowsHtml.match(/data-free/g) || []).length;
  $screens.innerHTML = `<section data-screen="agenda">${head()}
    <div class="blk-head"><div class="h-display">Agenda</div><div class="h-sub">${sub}</div></div>
    ${weekStrip()}
    <div class="day-sum"><span class="l">${count} atendimento${count === 1 ? '' : 's'} no dia</span>
      <span class="r">${fmt(expected)} previstos</span></div>
    <div class="blk-list" style="display:flex;flex-direction:column;gap:11px">${rowsHtml || '<div class="empty">Dia livre. Toque no + pra encaixar um atendimento.</div>'}</div>
    <aside class="agenda-side">
      <div class="card">
        <div class="h-title" style="margin-bottom:12px">Resumo do dia</div>
        <div class="tx"><div class="ic in">${I.cal}</div><div><div class="n">${count} atendimento${count === 1 ? '' : 's'}</div><div class="c">agendados pra este dia</div></div></div>
        <div class="tx"><div class="ic in">${I.up}</div><div><div class="n">${fmt(expected)}</div><div class="c">previstos se ninguém faltar</div></div></div>
        <div class="tx"><div class="ic pend">${I.clock}</div><div><div class="n">${freeCount} horário${freeCount === 1 ? '' : 's'} livre${freeCount === 1 ? '' : 's'}</div><div class="c">clique em Preencher pra encaixar</div></div></div>
      </div>
      <div class="hint">${I.heart}<span>Toque num atendimento pra confirmar, concluir ou cancelar. Concluiu? A entrada já cai no Financeiro.</span></div>
    </aside>
  </section>`;
  bindWeek();
  $screens.querySelectorAll('[data-apt]').forEach(b => { b.onclick = () => openAptActions(+b.dataset.apt); });
  $screens.querySelectorAll('[data-free]').forEach(b => { b.onclick = () => openNovoServico({ time: b.dataset.free }); });
}
function weekStrip() {
  const start = new Date(TODAY);
  start.setDate(start.getDate() - start.getDay() + 1 + state.weekOffset * 7); // comeca na segunda
  const busy = {};
  db.appointments.forEach(a => { if (a.status !== 'cancelado') busy[a.date] = true; });
  let days = '';
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const k = iso(d);
    days += `<button class="day ${k === iso(TODAY) ? 'today' : ''}" data-day="${k}" aria-pressed="${k === state.agendaDate}">
      <div class="dw">${DOW[d.getDay()]}</div><div class="dn">${d.getDate()}</div><span class="hd ${busy[k] ? '' : 'off'}"></span></button>`;
  }
  const arrow = dir => `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="${dir < 0 ? 'M14.5 6l-6 6 6 6' : 'M9.5 6l6 6-6 6'}"/></svg>`;
  return `<div class="week-wrap">
    <button class="wk-nav" data-wk="-1" aria-label="Semana anterior">${arrow(-1)}</button>
    <div class="week" role="group" aria-label="Dias da semana">${days}</div>
    <button class="wk-nav" data-wk="1" aria-label="Próxima semana">${arrow(1)}</button>
  </div>`;
}
function bindWeek() {
  $screens.querySelectorAll('[data-day]').forEach(b => { b.onclick = () => { state.agendaDate = b.dataset.day; renderAgenda(); }; });
  $screens.querySelectorAll('[data-wk]').forEach(b => { b.onclick = () => { state.weekOffset += +b.dataset.wk; renderAgenda(); }; });
}
const CHIPS = {
  agendado: '<span class="chip wait">Aguardando</span>',
  confirmado: '<span class="chip ok">✓ Confirmado</span>',
  concluido: '<span class="chip done">Concluído</span>',
  cancelado: '<span class="chip off">Cancelado</span>',
};
function agendaRows(list) {
  const items = [];
  let prevEnd = null;
  for (const a of list) {
    const [h, m] = a.time.split(':').map(Number);
    const startMin = h * 60 + m;
    // buraco de 1h ou mais entre atendimentos vira horario livre clicavel
    if (prevEnd !== null && startMin - prevEnd >= 60) items.push(freeSlot(minToH(prevEnd), minToH(startMin)));
    items.push(`<div class="apt"><div class="time">${a.time}</div>
      <button class="apt-card st-${a.status}" data-apt="${a.id}">
        <div class="r1"><span class="nm">${a.client}</span><span class="pr">${fmt(a.price)}</span></div>
        <div class="r2"><span class="sv">${a.service} · ${a.dur} min</span>${CHIPS[a.status] || ''}</div>
      </button></div>`);
    prevEnd = Math.max(prevEnd ?? 0, startMin + a.dur);
  }
  if (list.length && prevEnd < 18 * 60) items.push(freeSlot(minToH(prevEnd), '18:00'));
  return items.join('');
}
const minToH = min => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
function freeSlot(from, to) {
  return `<div class="apt"><div class="time">${from}</div>
    <button class="free-slot" data-free="${from}">
      <span><span class="t">Horário livre</span><br><span class="s">${from} até ${to} · toque para encaixar</span></span>
      <span class="go">Preencher</span></button></div>`;
}
function openAptActions(id) {
  const a = db.appointments.find(x => x.id === id);
  if (!a) return;
  const cli = db.clients.find(c => c.id === a.clientId);
  const svc = db.services.find(s => s.id === a.serviceId);
  openSheet(`${sheetHead(cli.name)}
    <div class="h-sub" style="margin:-8px 0 14px">${svc.name} · ${a.time} · ${fmt(a.price)} · ${a.pay}</div>
    <div class="action-list">
      ${a.status !== 'confirmado' && a.status !== 'concluido' ? `<button data-act="confirmado"><span class="chip ok">✓</span>Confirmar atendimento</button>` : ''}
      ${a.status !== 'concluido' ? `<button data-act="concluido"><span class="chip done">R$</span>Concluir e lançar no Financeiro</button>` : ''}
      ${a.status !== 'cancelado' ? `<button class="danger" data-act="cancelado">${I.x} Cancelar atendimento</button>`
        : `<button data-act="agendado"><span class="chip wait">↺</span>Reabrir como aguardando</button>`}
    </div>`);
  $sheet.querySelectorAll('[data-act]').forEach(b => {
    b.onclick = async () => {
      closeSheet();
      const st = b.dataset.act;
      await api.setAppointmentStatus(id, st);
      toast(st === 'concluido' ? 'Concluído! Entrada lançada no Financeiro.'
        : st === 'confirmado' ? 'Atendimento confirmado.'
        : st === 'cancelado' ? 'Atendimento cancelado.' : 'Atendimento reaberto.');
      render();
    };
  });
}

/* ------- novo servico ------- */
function openNovoServico(pre = {}) {
  openSheet(`${sheetHead('Novo Serviço')}
    <form id="f-ns" class="form">
      <div class="field"><label for="ns-cli">Cliente</label>
        <select id="ns-cli">${db.clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
          <option value="new">+ Nova cliente…</option></select></div>
      <div class="field"><label for="ns-date">Data</label><input id="ns-date" type="date" value="${pre.date || state.agendaDate || iso(TODAY)}"></div>
      <div class="field full" id="ns-newcli-wrap" hidden><label for="ns-newcli">Nome da nova cliente</label>
        <input id="ns-newcli" placeholder="Ex.: Larissa Souza"></div>
      <div class="field"><label for="ns-svc">Serviço</label>
        <select id="ns-svc">${db.services.map(s => `<option value="${s.id}" data-p="${s.price}" data-d="${s.dur}">${s.name}</option>`).join('')}</select></div>
      <div class="field"><label for="ns-time">Hora</label><input id="ns-time" type="time" value="${pre.time || '14:30'}"></div>
      <div class="field"><label for="ns-dur">Duração</label>
        <select id="ns-dur">${[30, 40, 45, 60, 75, 90, 120].map(d => `<option value="${d}">${d < 60 ? d + ' min' : (d / 60) + 'h' + (d % 60 ? ' ' + d % 60 + 'min' : '')}</option>`).join('')}</select></div>
      <div class="field"><label for="ns-pay">Pagamento</label>
        <select id="ns-pay">${['Pix', 'Dinheiro', 'Crédito', 'Débito'].map(p => `<option>${p}</option>`).join('')}</select></div>
      <div class="field"><label for="ns-val">Valor</label><input id="ns-val" class="money" inputmode="decimal" value="R$ 30,00"></div>
      <div class="field"><label for="ns-st">Status</label>
        <select id="ns-st"><option value="agendado">Agendado</option><option value="confirmado">Confirmado</option><option value="concluido">Concluído</option></select></div>
      <div class="field full"><label for="ns-note">Observações</label>
        <textarea id="ns-note" rows="2" placeholder="Ex.: desconto aplicado, cliente fidelidade."></textarea></div>
    </form>
    <button class="cta" id="ns-go">Adicionar novo serviço</button>
    <div class="cta-note">Entra automaticamente na sua Agenda e no Financeiro.</div>`);
  const $svc = $sheet.querySelector('#ns-svc');
  const $val = $sheet.querySelector('#ns-val');
  const $dur = $sheet.querySelector('#ns-dur');
  const $cli = $sheet.querySelector('#ns-cli');
  const syncSvc = () => {
    const o = $svc.selectedOptions[0];
    $val.value = fmt(+o.dataset.p);
    $dur.value = o.dataset.d;
  };
  $svc.onchange = syncSvc;
  syncSvc();
  $cli.onchange = () => { $sheet.querySelector('#ns-newcli-wrap').hidden = $cli.value !== 'new'; };
  $sheet.querySelector('#f-ns').addEventListener('submit', e => e.preventDefault());
  $sheet.querySelector('#ns-go').onclick = async () => {
    const value = parseFloat($val.value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    const isNew = $cli.value === 'new';
    const newName = ($sheet.querySelector('#ns-newcli').value || '').trim();
    if (isNew && !newName) { toast('Escreve o nome da nova cliente 😉'); return; }
    const p = {
      date: $sheet.querySelector('#ns-date').value, time: $sheet.querySelector('#ns-time').value,
      clientId: isNew ? null : +$cli.value, newClient: isNew ? newName : null,
      serviceId: +$svc.value, pay: $sheet.querySelector('#ns-pay').value, price: value,
      status: $sheet.querySelector('#ns-st').value, note: $sheet.querySelector('#ns-note').value,
    };
    closeSheet();
    await api.createAppointment(p);
    state.agendaDate = p.date;
    toast(p.status === 'concluido' ? 'Adicionado! Já está na Agenda e no Financeiro.' : 'Adicionado! Já está na sua Agenda.');
    if (state.tab !== 'agenda') go('agenda'); else render();
  };
}

/* ------- financeiro ------- */
const CAT_COLORS = { 'Material de trabalho': '#22D3EE', 'Aluguel do espaço': '#8B5CF6', 'Transporte': '#FBBF24', 'Outros': '#FB7185' };
async function renderFinanceiro() {
  $screens.innerHTML = `<section data-screen="financeiro">${head()}
    <div class="blk-head"><div class="h-display">Financeiro</div><div class="h-sub">Entradas, saídas e saldo do mês</div></div>
    ${skel(120)}${skel(80)}${skel(160)}${skel(220)}</section>`;
  const f = await api.getFinance(iso(TODAY).slice(0, 7));
  if (state.tab !== 'financeiro') return;
  const catTotal = Object.values(f.cats).reduce((a, b) => a + b, 0) || 1;
  const cats = Object.entries(f.cats).sort((a, b) => b[1] - a[1]).map(([n, v]) => `
    <div class="catbar"><div class="r"><span class="n">${n}</span><span class="v">${fmt(v)} · ${Math.round(v / catTotal * 100)}%</span></div>
    <div class="track"><i data-w="${(v / catTotal * 100).toFixed(1)}%" style="width:0;background:${CAT_COLORS[n] || '#6366F1'}"></i></div></div>`).join('');
  $screens.innerHTML = `<section data-screen="financeiro">${head()}
    <div class="blk-head"><div class="h-display">Financeiro</div><div class="h-sub">Entradas, saídas e saldo de ${MESES[TODAY.getMonth()]}</div></div>
    <div class="card hero blk-hero">
      <div class="rowhead"><span class="metric-label">Saldo do mês</span>
        <span class="chip ${f.saldo >= 0 ? 'ok' : 'off'}">${f.saldo >= 0 ? '↑ positivo' : '↓ negativo'}</span></div>
      <div class="metric" data-count="${f.saldo}">${fmt(0)}</div>
      <div class="metric-note" style="color:var(--muted);font-weight:500">Entradas − saídas · atualizado agora</div>
    </div>
    <div class="inout blk-inout">
      <div class="tile"><div class="t"><span class="chip ok" style="padding:3px 7px">${I.up}</span>Entradas</div>
        <div class="v pos" data-count="${f.in}">${fmt(0)}</div></div>
      <div class="tile"><div class="t"><span class="chip off" style="padding:3px 7px">${I.down}</span>Saídas</div>
        <div class="v neg" data-count="${f.out}">${fmt(0)}</div></div>
    </div>
    <div class="card blk-cats"><div class="h-title" style="margin-bottom:12px">Saídas por categoria</div>${cats || '<div class="empty">Nenhuma saída lançada neste mês.</div>'}</div>
    <div class="card blk-tx">
      <div class="rowhead"><span class="h-title">Lançamentos recentes</span>
        <button class="link" id="add-out">+ Nova saída</button></div>
      <div>${f.tx.slice(0, 8).map(txRow).join('') || '<div class="empty">Sem lançamentos ainda.</div>'}</div>
    </div></section>`;
  document.getElementById('add-out').onclick = openNovaSaida;
  countUps();
  animateTracks();
}
function openNovaSaida() {
  openSheet(`${sheetHead('Nova saída')}
    <form id="f-out" class="form">
      <div class="field full"><label for="out-label">Descrição</label><input id="out-label" placeholder="Ex.: Esmaltes NailArt"></div>
      <div class="field"><label for="out-cat">Categoria</label>
        <select id="out-cat">${Object.keys(CAT_COLORS).map(c => `<option>${c}</option>`).join('')}</select></div>
      <div class="field"><label for="out-val">Valor</label><input id="out-val" class="money" inputmode="decimal" placeholder="R$ 0,00"></div>
      <div class="field"><label for="out-date">Data</label><input id="out-date" type="date" value="${iso(TODAY)}"></div>
      <div class="field"><label for="out-pay">Pagamento</label>
        <select id="out-pay">${['Pix', 'Dinheiro', 'Crédito', 'Débito'].map(p => `<option>${p}</option>`).join('')}</select></div>
    </form>
    <button class="cta" id="out-go">Lançar saída</button>`);
  $sheet.querySelector('#f-out').addEventListener('submit', e => e.preventDefault());
  $sheet.querySelector('#out-go').onclick = async () => {
    const label = ($sheet.querySelector('#out-label').value || '').trim();
    const value = parseFloat(($sheet.querySelector('#out-val').value || '').replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    if (!label || !value) { toast('Preenche a descrição e o valor 😉'); return; }
    const p = {
      label, value, cat: $sheet.querySelector('#out-cat').value,
      date: $sheet.querySelector('#out-date').value, pay: $sheet.querySelector('#out-pay').value,
    };
    closeSheet();
    await api.createExpense(p);
    toast('Saída lançada no Financeiro.');
    render();
  };
}

/* ------- clientes ------- */
async function renderClientes() {
  $screens.innerHTML = `<section data-screen="clientes">${head()}
    <div class="blk-head"><div class="h-display">Clientes</div><div class="h-sub">Carregando…</div></div>
    ${skel(46)}${skel(36)}${skel(300)}</section>`;
  const all = await api.getClients();
  if (state.tab !== 'clientes') return;
  const news = all.filter(c => c.nova).length;
  const filters = [['todas', 'Todas'], ['frequentes', 'Frequentes'], ['novas', 'Novas'], ['semretorno', 'Sem retorno']];
  const apply = () => {
    let list = all.filter(c => c.visits > 0 || c.nova);
    if (state.cliFilter === 'frequentes') list = list.filter(c => c.fiel);
    if (state.cliFilter === 'novas') list = list.filter(c => c.nova);
    if (state.cliFilter === 'semretorno') list = list.filter(c => c.semRetorno);
    if (state.cliQuery) list = list.filter(c => c.name.toLowerCase().includes(state.cliQuery.toLowerCase()));
    return list.sort((a, b) => (b.last || '').localeCompare(a.last || ''));
  };
  const rows = list => list.map(c => {
    const initials = c.name.split(' ').map(w => w[0]).slice(0, 2).join('');
    const d = c.last ? parseISO(c.last) : null;
    const sub = d ? `Último · ${pad(d.getDate())}/${pad(d.getMonth() + 1)}` : 'Primeiro atendimento em breve';
    return `<button class="cli ${c.fiel ? 'is-fiel' : ''}" data-cli="${c.id}">
      <span class="av" style="background:${c.color}">${initials}</span>
      <span><span class="n">${c.name}</span><br><span class="c">${sub} · ${c.visits} atendimento${c.visits === 1 ? '' : 's'}</span></span>
      <span class="end">${c.fiel ? '<span class="chip badge-fiel">★ Fiel</span>' : ''}${c.nova ? '<span class="chip badge-nova">Nova</span>' : ''}</span>
    </button>`;
  }).join('') || '<div class="empty">Nenhuma cliente nesse filtro.</div>';
  $screens.innerHTML = `<section data-screen="clientes">${head()}
    <div class="blk-head"><div class="h-display">Clientes</div><div class="h-sub">${all.filter(c => c.visits > 0 || c.nova).length} no total · ${news} nova${news === 1 ? '' : 's'} neste mês</div></div>
    <div class="search">${I.search}<input id="cli-q" placeholder="Buscar por nome" value="${state.cliQuery}"></div>
    <div class="filters">${filters.map(([k, l]) => `<button data-f="${k}" aria-pressed="${state.cliFilter === k}">${l}</button>`).join('')}</div>
    <div class="card blk-list" id="cli-list">${rows(apply())}</div>
    <div class="hint">${I.heart}<span><b>Anote preferências no perfil da cliente:</b> cor favorita, alergias, formato de unha.</span></div>
  </section>`;
  const $list = document.getElementById('cli-list');
  const rebind = () => { $list.querySelectorAll('[data-cli]').forEach(b => { b.onclick = () => openCliente(+b.dataset.cli); }); };
  rebind();
  document.getElementById('cli-q').oninput = e => { state.cliQuery = e.target.value; $list.innerHTML = rows(apply()); rebind(); };
  $screens.querySelectorAll('[data-f]').forEach(b => {
    b.onclick = () => {
      state.cliFilter = b.dataset.f;
      $screens.querySelectorAll('[data-f]').forEach(x => x.setAttribute('aria-pressed', x === b));
      $list.innerHTML = rows(apply());
      rebind();
    };
  });
}
async function openCliente(id) {
  const c = db.clients.find(x => x.id === id);
  openSheet(`${sheetHead(c.name)}<div class="h-sub" style="margin:-8px 0 12px">Carregando histórico…</div>`);
  const hist = await api.getClientHistory(id);
  const done = hist.filter(h => h.status === 'concluido');
  const spent = done.reduce((s, h) => s + h.price, 0);
  const STATUS = {
    concluido: ['done', 'Concluído'], confirmado: ['ok', 'Confirmado'],
    agendado: ['wait', 'Aguardando'], cancelado: ['off', 'Cancelado'],
  };
  openSheet(`${sheetHead(c.name)}
    <div class="tiles" style="margin-bottom:14px">
      <div class="tile"><div class="t">Atendimentos</div><div class="v">${done.length}</div></div>
      <div class="tile"><div class="t">Total gasto</div><div class="v" style="color:var(--cyan)">${fmt(spent)}</div></div>
    </div>
    ${c.note ? `<div class="hint" style="margin-bottom:14px">${I.heart}<span>${c.note}</span></div>` : ''}
    <div class="eyebrow" style="margin-bottom:8px">Histórico recente</div>
    <div class="card" style="padding:4px 14px">${hist.map(h => {
      const d = parseISO(h.date);
      const [st, lbl] = STATUS[h.status];
      return `<div class="tx"><div class="ic ${h.status === 'cancelado' ? 'out' : 'in'}">${I.clock}</div>
        <div><div class="n">${h.service}</div><div class="c">${pad(d.getDate())}/${pad(d.getMonth() + 1)} · ${h.time}</div></div>
        <div class="val"><div class="v">${fmt(h.price)}</div><div class="b"><span class="chip ${st}" style="padding:2px 8px;font-size:10.5px">${lbl}</span></div></div></div>`;
    }).join('') || '<div class="empty">Sem histórico ainda.</div>'}</div>`);
}

/* ------- metas e tarefas ------- */
async function renderMetas() {
  $screens.innerHTML = `<section data-screen="metas">${head()}
    <div class="blk-head"><div class="h-display">Metas &amp; Tarefas</div><div class="h-sub">Foco do mês e pendências do dia</div></div>
    ${skel(110)}${skel(110)}${skel(220)}</section>`;
  const g = await api.getGoals();
  if (state.tab !== 'metas') return;
  const p1 = Math.min(100, g.rev / g.revenue * 100);
  const p2 = Math.min(100, g.count / g.appts * 100);
  const doneTasks = g.tasks.filter(t => t.done).length;
  $screens.innerHTML = `<section data-screen="metas">${head()}
    <div class="blk-head"><div class="h-display">Metas &amp; Tarefas</div><div class="h-sub">Foco de ${MESES[TODAY.getMonth()]} e pendências do dia</div></div>
    <div class="card goal blk-g1">
      <div class="top"><div><div class="metric-label">Meta de faturamento</div>
        <div class="big">${fmt(g.rev)} <span class="of">de ${fmtK(g.revenue)}</span></div></div>
        <div style="text-align:right"><div class="pct cy">${Math.round(p1)}%</div>
        <button class="link" data-edit-goals style="font-size:12px">editar</button></div></div>
      <div class="track"><i data-w="${p1}%" style="width:0;background:var(--grad)"></i></div>
      <div class="foot">${g.rev < g.revenue
        ? `Faltam ${fmt(g.revenue - g.rev)} · ritmo atual fecha o mês em ${fmtK(Math.round(g.proj))}`
        : `Meta batida! Projeção do mês: ${fmtK(Math.round(g.proj))}`}</div>
    </div>
    <div class="card goal blk-g2">
      <div class="top"><div><div class="metric-label">Meta de atendimentos</div>
        <div class="big">${g.count} <span class="of">de ${g.appts} atendimentos</span></div></div>
        <div class="pct vi">${Math.round(p2)}%</div></div>
      <div class="track"><i data-w="${p2}%" style="width:0;background:var(--violet)"></i></div>
      <div class="foot">${g.count < g.appts
        ? `Faltam ${g.appts - g.count} · você fez ${g.weekCount} só nesta semana`
        : `Meta batida com ${g.weekCount} nesta semana!`}</div>
    </div>
    <div class="card blk-tasks">
      <div class="rowhead"><span class="h-title">Tarefas de hoje</span>
        <span class="chip ok">${doneTasks} de ${g.tasks.length} concluídas</span></div>
      <div class="goal"><div class="track" style="margin:12px 0 6px"><i data-w="${g.tasks.length ? doneTasks / g.tasks.length * 100 : 0}%" style="width:0;background:var(--mint)"></i></div></div>
      <div>${g.tasks.map(t => `<button class="task ${t.done ? 'done' : ''}" data-task="${t.id}">
        <span class="box">${t.done ? I.check : ''}</span><span class="lb">${t.label}</span></button>`).join('')}</div>
      <div class="task-add"><input id="task-new" placeholder="Nova tarefa…">
        <button id="task-add" style="background:var(--elevated);border:1px solid var(--stroke);border-radius:12px;padding:0 16px;font-weight:700;color:var(--cyan)">+</button></div>
    </div>
    <div class="reminder blk-side">${I.bell}<span><span class="t">Lembrete de sexta</span><br><span class="s">Pagar o aluguel do espaço · R$ 550</span></span></div>
  </section>`;
  $screens.querySelectorAll('[data-task]').forEach(b => { b.onclick = async () => { await api.toggleTask(+b.dataset.task); renderMetas(); }; });
  document.getElementById('task-add').onclick = addNewTask;
  document.getElementById('task-new').addEventListener('keydown', e => { if (e.key === 'Enter') addNewTask(); });
  $screens.querySelector('[data-edit-goals]').onclick = () => openEditGoals(g);
  animateTracks();
}
async function addNewTask() {
  const inp = document.getElementById('task-new');
  const v = (inp.value || '').trim();
  if (!v) return;
  await api.addTask(v);
  renderMetas();
}
function openEditGoals(g) {
  openSheet(`${sheetHead('Editar metas do mês')}
    <form id="f-goals" class="form">
      <div class="field"><label for="g-rev">Faturamento (R$)</label><input id="g-rev" inputmode="numeric" value="${g.revenue}"></div>
      <div class="field"><label for="g-ap">Atendimentos</label><input id="g-ap" inputmode="numeric" value="${g.appts}"></div>
    </form><button class="cta" id="g-go">Salvar metas</button>`);
  $sheet.querySelector('#f-goals').addEventListener('submit', e => e.preventDefault());
  $sheet.querySelector('#g-go').onclick = async () => {
    const revenue = parseInt($sheet.querySelector('#g-rev').value.replace(/\D/g, '')) || g.revenue;
    const appts = parseInt($sheet.querySelector('#g-ap').value.replace(/\D/g, '')) || g.appts;
    closeSheet();
    await api.setGoals({ revenue, appts });
    toast('Metas atualizadas.');
    renderMetas();
  };
}

/* ------- router ------- */
function render() {
  ({ inicio: renderInicio, agenda: renderAgenda, financeiro: renderFinanceiro, clientes: renderClientes, metas: renderMetas }[state.tab])();
}
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$sheet.hidden) closeSheet(); });

const anchor = (location.hash || '').replace('#', '');
if (TABS.some(t => t.id === anchor)) state.tab = anchor;
go(state.tab);
