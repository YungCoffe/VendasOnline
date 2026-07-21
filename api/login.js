const { signToken } = require('../lib/auth');
const { getSenhaHash } = require('../lib/db');
const { hashSenha, senhaCorreta } = require('../lib/senha');
const { verificarCaptcha } = require('../lib/captcha');
const { obterIp, verificarBloqueio, registrarTentativaFalha, limparTentativas } = require('../lib/rateLimit');

// Senha padrão usada apenas na PRIMEIRA vez (antes de qualquer troca via painel).
// Defina ADMIN_SENHA_PADRAO nas variáveis de ambiente da Vercel para não deixar no código.
const SENHA_PADRAO = process.env.ADMIN_SENHA_PADRAO || 'admin123';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ erro: 'Método não permitido' });
    return;
  }

  const ip = obterIp(req);

  try {
    // 1. Verifica se esse IP já está bloqueado por excesso de tentativas
    const bloqueio = await verificarBloqueio(ip);
    if (bloqueio.bloqueado) {
      const minutos = Math.ceil(bloqueio.segundosRestantes / 60);
      res.status(429).json({
        erro: `Muitas tentativas erradas. Tente novamente em ${minutos} minuto(s).`,
        bloqueado: true,
      });
      return;
    }

    const { senha, captchaId, captchaResposta } = req.body || {};

    if (!senha) {
      res.status(400).json({ erro: 'Senha é obrigatória' });
      return;
    }

    // 2. Verifica o captcha antes de checar a senha
    const captchaOk = await verificarCaptcha(captchaId, captchaResposta);
    if (!captchaOk) {
      const tentativas = await registrarTentativaFalha(ip);
      res.status(400).json({
        erro: 'Captcha incorreto. Tente de novo.',
        captchaInvalido: true,
        tentativasRestantes: Math.max(0, 5 - tentativas),
      });
      return;
    }

    // 3. Verifica a senha
    const hashSalvo = (await getSenhaHash()) || hashSenha(SENHA_PADRAO);

    if (!senhaCorreta(senha, hashSalvo)) {
      const tentativas = await registrarTentativaFalha(ip);
      const restantes = Math.max(0, 5 - tentativas);
      res.status(401).json({
        erro: restantes > 0 ? `Senha incorreta. ${restantes} tentativa(s) restante(s).` : 'Senha incorreta.',
      });
      return;
    }

    // 4. Login certo - limpa o histórico de tentativas desse IP
    await limparTentativas(ip);

    const token = signToken();
    res.status(200).json({ token });
  } catch (e) {
    console.error('Erro no login:', e);
    res.status(500).json({
      erro: e.message || 'Erro no servidor.',
    });
  }
};
