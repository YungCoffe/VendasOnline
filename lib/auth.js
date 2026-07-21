const crypto = require('crypto');

// Segredo usado para assinar os tokens de sessão do admin.
// Defina ADMIN_TOKEN_SECRET nas variáveis de ambiente da Vercel (qualquer string longa e aleatória).
// Se não for definida, usa um valor padrão (troque em produção!).
const SECRET = process.env.ADMIN_TOKEN_SECRET || 'troque-este-segredo-em-producao';

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 horas

function signToken() {
  const expira = Date.now() + TOKEN_TTL_MS;
  const payload = `admin.${expira}`;
  const assinatura = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}.${assinatura}`).toString('base64url');
}

function verifyToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const [prefix, expiraStr, assinatura] = decoded.split('.');
    const payload = `${prefix}.${expiraStr}`;
    const esperada = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');

    if (assinatura !== esperada) return false;
    if (Date.now() > parseInt(expiraStr, 10)) return false;

    return true;
  } catch (e) {
    return false;
  }
}

// Extrai e valida o token do header Authorization: Bearer <token>
function estaAutenticado(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return false;
  return verifyToken(token);
}

module.exports = { signToken, verifyToken, estaAutenticado };
