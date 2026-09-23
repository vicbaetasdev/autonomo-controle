// GET  /api/appointments?date=2026-09-22  agenda do dia
// POST /api/appointments                  cria atendimento
// PATCH /api/appointments?id=12           muda status
// tudo em memoria, sem persistencia entre requests (por enquanto e mock:
// os contratos sao os que o app vai consumir no ORDS/APEX depois)
import { agendaDo, createAppointment, setAppointmentStatus } from '../js/store.js';

export default function handler(req, res) {
  if (req.method === 'GET') {
    const date = req.query.date;
    if (!date) return res.status(400).json({ error: 'informe ?date=AAAA-MM-DD' });
    return res.status(200).json(agendaDo(date));
  }
  if (req.method === 'POST') {
    const p = req.body || {};
    if (!p.date || !p.time || !p.serviceId) return res.status(400).json({ error: 'date, time e serviceId sao obrigatorios' });
    return res.status(201).json(createAppointment(p));
  }
  if (req.method === 'PATCH') {
    const out = setAppointmentStatus(Number(req.query.id), (req.body || {}).status);
    return out ? res.status(200).json(out) : res.status(404).json({ error: 'atendimento nao encontrado' });
  }
  res.setHeader('Allow', 'GET, POST, PATCH');
  return res.status(405).json({ error: 'metodo nao suportado' });
}
