// GET /api/services   catalogo de servicos com preco e duracao
import { listServices } from '../js/store.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'metodo nao suportado' });
  }
  return res.status(200).json(listServices());
}
