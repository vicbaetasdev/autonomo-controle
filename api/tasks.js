// POST  /api/tasks         cria tarefa
// PATCH /api/tasks?id=2    alterna concluida/pendente
import { addTask, toggleTask } from '../js/store.js';

export default function handler(req, res) {
  if (req.method === 'POST') {
    const label = ((req.body || {}).label || '').trim();
    if (!label) return res.status(400).json({ error: 'label e obrigatorio' });
    return res.status(201).json(addTask(label));
  }
  if (req.method === 'PATCH') return res.status(200).json(toggleTask(Number(req.query.id)));
  res.setHeader('Allow', 'POST, PATCH');
  return res.status(405).json({ error: 'metodo nao suportado' });
}
