const { getClient } = require('./redisClient');

const PRODUTOS_INICIAIS = [
  {
    id: 1,
    nome: 'Exemplo: Nome do Produto',
    descricao: 'Descrição do produto aqui. Substitua pelos seus produtos reais.',
    preco: 0.0,
    preco_original: 0.0,
    categoria: 'shopee',
    imagem: 'https://via.placeholder.com/400x300?text=Seu+Produto',
    link_afiliado: 'https://seu-link-afiliado-aqui.com',
    destaque: true,
    data_adicao: new Date().toISOString().split('T')[0],
    cliques: 0,
  },
];

async function getProdutos() {
  const client = await getClient();
  const salvos = await client.get('produtos');
  if (!salvos) {
    await client.set('produtos', JSON.stringify(PRODUTOS_INICIAIS));
    return PRODUTOS_INICIAIS;
  }
  return JSON.parse(salvos);
}

async function setProdutos(produtos) {
  const client = await getClient();
  await client.set('produtos', JSON.stringify(produtos));
  return produtos;
}

async function getSenhaHash() {
  const client = await getClient();
  return client.get('admin_senha_hash');
}

async function setSenhaHash(hash) {
  const client = await getClient();
  return client.set('admin_senha_hash', hash);
}

async function registrarVisita() {
  const client = await getClient();
  const hoje = new Date().toISOString().split('T')[0];
  await client.incr(`visitas:${hoje}`);
}

async function registrarClique(produtoId) {
  const client = await getClient();
  await client.incr('cliques:total');
  const produtos = await getProdutos();
  const p = produtos.find((x) => x.id === produtoId);
  if (p) {
    p.cliques = (p.cliques || 0) + 1;
    await setProdutos(produtos);
  }
}

async function getEstatisticas() {
  const client = await getClient();
  const hoje = new Date().toISOString().split('T')[0];
  const visitasHoje = parseInt((await client.get(`visitas:${hoje}`)) || '0', 10);
  const cliquesTotal = parseInt((await client.get('cliques:total')) || '0', 10);
  return { visitasHoje, cliquesTotal };
}

module.exports = {
  getProdutos,
  setProdutos,
  getSenhaHash,
  setSenhaHash,
  registrarVisita,
  registrarClique,
  getEstatisticas,
};
