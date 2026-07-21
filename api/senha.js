const { estaAutenticado } = require('../lib/auth');
const { setSenhaHash } = require('../lib/db');
const { hashSenha } = require('../lib/senha');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ erro: 'Método não permitido' });
    return;
  }

  if (!estaAutenticado(req)) {
    res.status(401).json({ erro: 'Não autorizado' });
    return;
  }

  const { novaSenha } = req.body || {};
  if (!novaSenha || novaSenha.length < 4) {
    res.status(400).json({ erro: 'Senha deve ter pelo menos 4 caracteres' });
    return;
  }

  try {
    await setSenhaHash(hashSenha(novaSenha));
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Erro em /api/senha:', e);
    res.status(500).json({ erro: e.message || 'Erro no servidor' });
  }
};
