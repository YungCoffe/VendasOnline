const { estaAutenticado } = require('../lib/auth');
const { registrarVisita, registrarClique, getEstatisticas } = require('../lib/db');

module.exports = async (req, res) => {
  try {
    if (req.method === 'POST') {
      const { tipo, produtoId } = req.body || {};
      if (tipo === 'visita') {
        await registrarVisita();
        res.status(200).json({ ok: true });
        return;
      }
      if (tipo === 'clique' && produtoId) {
        await registrarClique(produtoId);
        res.status(200).json({ ok: true });
        return;
      }
      res.status(400).json({ erro: 'tipo inválido' });
      return;
    }

    if (req.method === 'GET') {
      if (!estaAutenticado(req)) {
        res.status(401).json({ erro: 'Não autorizado' });
        return;
      }
      const stats = await getEstatisticas();
      res.status(200).json(stats);
      return;
    }

    res.status(405).json({ erro: 'Método não permitido' });
  } catch (e) {
    console.error('Erro em /api/estatisticas:', e);
    res.status(500).json({ erro: e.message || 'Erro no servidor' });
  }
};
