// GET /api/dashboard   indicadores do mes: total, delta, ticket medio, receita por dia
import { dashboard } from '../js/store.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'metodo nao suportado' });
  }
  return res.status(200).json(dashboard());
}
