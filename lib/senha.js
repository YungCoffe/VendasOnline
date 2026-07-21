const crypto = require('crypto');

const SALT = 'loja-afiliados-salt-fixo'; // ok ser fixo aqui pois é senha única de admin, não de vários usuários

function hashSenha(senhaTexto) {
  return crypto.pbkdf2Sync(senhaTexto, SALT, 100000, 32, 'sha256').toString('hex');
}

function senhaCorreta(senhaTexto, hashSalvo) {
  const hashAtual = hashSenha(senhaTexto);
  // comparação em tempo constante para evitar timing attacks
  const a = Buffer.from(hashAtual);
  const b = Buffer.from(hashSalvo);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = { hashSenha, senhaCorreta };
