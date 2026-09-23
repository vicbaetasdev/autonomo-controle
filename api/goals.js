// GET /api/goals   metas do mes + progresso + tarefas
// PUT /api/goals   atualiza os alvos de faturamento e atendimentos
import { goalsState, setGoals } from '../js/store.js';

export default function handler(req, res) {
  if (req.method === 'GET') return res.status(200).json(goalsState());
  if (req.method === 'PUT') return res.status(200).json(setGoals(req.body || {}));
  res.setHeader('Allow', 'GET, PUT');
  return res.status(405).json({ error: 'metodo nao suportado' });
}
