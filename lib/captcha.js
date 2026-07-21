const crypto = require('crypto');
const { getClient } = require('./redisClient');

const CAPTCHA_TTL_SEGUNDOS = 5 * 60; // 5 minutos pra responder

function numeroAleatorio(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Gera uma continha simples (soma ou subtração) e guarda a resposta no Redis
async function gerarCaptcha() {
  const client = await getClient();
  const id = crypto.randomBytes(12).toString('hex');

  const a = numeroAleatorio(1, 20);
  const b = numeroAleatorio(1, 20);
  const operacao = Math.random() > 0.5 ? '+' : '-';

  let resposta;
  let pergunta;
  if (operacao === '+') {
    resposta = a + b;
    pergunta = `Quanto é ${a} + ${b}?`;
  } else {
    // garante que não fica negativo, pra ficar mais simples de resolver de cabeça
    const maior = Math.max(a, b);
    const menor = Math.min(a, b);
    resposta = maior - menor;
    pergunta = `Quanto é ${maior} - ${menor}?`;
  }

  await client.set(`captcha:${id}`, String(resposta), { EX: CAPTCHA_TTL_SEGUNDOS });

  return { id, pergunta };
}

// Confere a resposta e invalida o captcha (uso único), mesmo se errar
async function verificarCaptcha(id, respostaEnviada) {
  if (!id || respostaEnviada === undefined || respostaEnviada === null) return false;

  const client = await getClient();
  const chave = `captcha:${id}`;
  const respostaCorreta = await client.get(chave);

  await client.del(chave); // uso único: certo ou errado, não serve mais

  if (respostaCorreta === null) return false; // expirou ou já foi usado
  return String(respostaEnviada).trim() === respostaCorreta;
}

module.exports = { gerarCaptcha, verificarCaptcha };
