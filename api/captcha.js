const { gerarCaptcha } = require('../lib/captcha');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ erro: 'Método não permitido' });
    return;
  }

  try {
    const { id, pergunta } = await gerarCaptcha();
    res.status(200).json({ id, pergunta });
  } catch (e) {
    console.error('Erro em /api/captcha:', e);
    res.status(500).json({ erro: e.message || 'Erro no servidor' });
  }
};
