const { getClient } = require('./redisClient');

const MAX_TENTATIVAS = 5;
const JANELA_BLOQUEIO_SEGUNDOS = 15 * 60; // 15 minutos

// Pega o IP real do visitante, considerando que a Vercel roda atrás de proxy
function obterIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'desconhecido';
}

// Verifica se o IP está bloqueado por excesso de tentativas erradas
async function verificarBloqueio(ip) {
  const client = await getClient();
  const chave = `tentativas:${ip}`;
  const tentativas = parseInt((await client.get(chave)) || '0', 10);

  if (tentativas >= MAX_TENTATIVAS) {
    const ttl = await client.ttl(chave);
    return { bloqueado: true, segundosRestantes: ttl > 0 ? ttl : JANELA_BLOQUEIO_SEGUNDOS };
  }

  return { bloqueado: false, tentativasRestantes: MAX_TENTATIVAS - tentativas };
}

// Chamado quando a senha ou o captcha estão errados
async function registrarTentativaFalha(ip) {
  const client = await getClient();
  const chave = `tentativas:${ip}`;
  const novoValor = await client.incr(chave);
  if (novoValor === 1) {
    await client.expire(chave, JANELA_BLOQUEIO_SEGUNDOS);
  }
  return novoValor;
}

// Chamado quando o login dá certo - limpa o histórico de tentativas do IP
async function limparTentativas(ip) {
  const client = await getClient();
  await client.del(`tentativas:${ip}`);
}

module.exports = { obterIp, verificarBloqueio, registrarTentativaFalha, limparTentativas, MAX_TENTATIVAS };
