const { estaAutenticado } = require('../lib/auth');
const { getProdutos, setProdutos } = require('../lib/db');

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const produtos = await getProdutos();
      res.status(200).json(produtos);
      return;
    }

    // Todas as escritas exigem login de admin
    if (!estaAutenticado(req)) {
      res.status(401).json({ erro: 'Não autorizado' });
      return;
    }

    if (req.method === 'POST') {
      const dados = req.body || {};
      if (!dados.nome || dados.preco === undefined || !dados.link_afiliado) {
        res.status(400).json({ erro: 'Campos obrigatórios faltando' });
        return;
      }

      const produtos = await getProdutos();
      const novoProduto = {
        id: Date.now(),
        nome: dados.nome,
        descricao: dados.descricao || '',
        preco: parseFloat(dados.preco),
        preco_original: parseFloat(dados.preco_original) || 0,
        categoria: dados.categoria || 'shopee',
        imagem: dados.imagem || 'https://via.placeholder.com/400x300',
        link_afiliado: dados.link_afiliado,
        destaque: !!dados.destaque,
        data_adicao: new Date().toISOString().split('T')[0],
        cliques: 0,
      };
      produtos.push(novoProduto);
      await setProdutos(produtos);
      res.status(201).json(novoProduto);
      return;
    }

    if (req.method === 'PUT') {
      const dados = req.body || {};
      if (!dados.id) {
        res.status(400).json({ erro: 'id é obrigatório' });
        return;
      }

      const produtos = await getProdutos();
      const idx = produtos.findIndex((p) => p.id === dados.id);
      if (idx === -1) {
        res.status(404).json({ erro: 'Produto não encontrado' });
        return;
      }

      produtos[idx] = {
        ...produtos[idx],
        nome: dados.nome ?? produtos[idx].nome,
        descricao: dados.descricao ?? produtos[idx].descricao,
        preco: dados.preco !== undefined ? parseFloat(dados.preco) : produtos[idx].preco,
        preco_original:
          dados.preco_original !== undefined ? parseFloat(dados.preco_original) : produtos[idx].preco_original,
        categoria: dados.categoria ?? produtos[idx].categoria,
        imagem: dados.imagem ?? produtos[idx].imagem,
        link_afiliado: dados.link_afiliado ?? produtos[idx].link_afiliado,
        destaque: dados.destaque !== undefined ? !!dados.destaque : produtos[idx].destaque,
      };

      await setProdutos(produtos);
      res.status(200).json(produtos[idx]);
      return;
    }

    if (req.method === 'DELETE') {
      const id = parseInt(req.query.id, 10);
      if (!id) {
        res.status(400).json({ erro: 'id é obrigatório (?id=...)' });
        return;
      }

      const produtos = await getProdutos();
      const novaLista = produtos.filter((p) => p.id !== id);
      await setProdutos(novaLista);
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ erro: 'Método não permitido' });
  } catch (e) {
    console.error('Erro em /api/produtos:', e);
    res.status(500).json({ erro: e.message || 'Erro no servidor' });
  }
};
