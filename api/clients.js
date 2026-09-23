// GET /api/clients          lista com indicadores (fiel, nova, sem retorno)
// GET /api/clients?id=3     historico de atendimentos da cliente
import { listClients, clientHistory } from '../js/store.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'metodo nao suportado' });
  }
  if (req.query.id) return res.status(200).json(clientHistory(Number(req.query.id)));
  return res.status(200).json(listClients());
}
