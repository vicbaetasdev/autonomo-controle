// GET  /api/finance?month=2026-09   resumo do mes (entradas, saidas, saldo, categorias)
// POST /api/finance                 lanca uma saida
import { finance, createExpense } from '../js/store.js';

export default function handler(req, res) {
  if (req.method === 'GET') {
    const month = req.query.month;
    if (!month) return res.status(400).json({ error: 'informe ?month=AAAA-MM' });
    return res.status(200).json(finance(month));
  }
  if (req.method === 'POST') {
    const p = req.body || {};
    if (!p.label || !p.value) return res.status(400).json({ error: 'label e value sao obrigatorios' });
    createExpense(p);
    return res.status(201).json({ ok: true });
  }
  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'metodo nao suportado' });
}
