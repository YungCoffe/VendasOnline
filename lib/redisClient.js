const { createClient } = require('redis');

// A Vercel injeta a variável REDIS_URL automaticamente quando você conecta
// a integração "Redis" (Redis Cloud) do Marketplace ao projeto.
const REDIS_URL = process.env.REDIS_URL;

let clientPromise = null;

// Em ambiente serverless, cada função pode ser reaproveitada entre chamadas,
// então guardamos a conexão numa variável global pra não abrir uma nova toda hora.
function getClient() {
  if (!REDIS_URL) {
    throw new Error(
      'REDIS_URL não configurada. Conecte a integração "Redis" (Storage → Redis) ao projeto na Vercel.'
    );
  }

  if (!clientPromise) {
    const client = createClient({
      url: REDIS_URL,
      socket: { tls: REDIS_URL.startsWith('rediss://') },
    });
    client.on('error', (err) => console.error('Erro de conexão Redis:', err));
    clientPromise = client.connect().then(() => client);
  }

  return clientPromise;
}

module.exports = { getClient };
