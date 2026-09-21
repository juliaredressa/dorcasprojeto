const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dorcas_gestao',
  waitForConnections: true,
  connectionLimit: 10
});

// LISTAR CATEGORIAS
app.get('/api/categorias', async (req, res) => {
  try {
    const [categorias] = await pool.query(
      'SELECT * FROM categoria_item ORDER BY nome_categoria'
    );

    res.json(categorias);
  } catch (erro) {
    res.status(500).json({
      mensagem: 'Erro ao buscar categorias.'
    });
  }
});

// LISTAR PRODUTOS
app.get('/api/produtos', async (req, res) => {
  try {
    const [produtos] = await pool.query(`
      SELECT
        i.id_item,
        i.nome_item,
        i.tamanho,
        i.unidade_medida,
        i.quantidade_minima,
        i.id_categoria,
        c.nome_categoria
      FROM item_doacao i
      INNER JOIN categoria_item c
        ON c.id_categoria = i.id_categoria
      ORDER BY i.nome_item
    `);

    res.json(produtos);
  } catch (erro) {
    res.status(500).json({
      mensagem: 'Erro ao buscar produtos.'
    });
  }
});

// BUSCAR UM PRODUTO
app.get('/api/produtos/:id', async (req, res) => {
  try {
    const [resultado] = await pool.query(
      'SELECT * FROM item_doacao WHERE id_item = ?',
      [req.params.id]
    );

    if (resultado.length === 0) {
      return res.status(404).json({
        mensagem: 'Produto não encontrado.'
      });
    }

    res.json(resultado[0]);
  } catch (erro) {
    res.status(500).json({
      mensagem: 'Erro ao buscar produto.'
    });
  }
});

// VALIDAÇÃO
function validarProduto(dados) {
  const {
    nome_item,
    unidade_medida,
    quantidade_minima,
    id_categoria
  } = dados;

  if (!nome_item || !nome_item.trim()) {
    return 'Informe o nome do produto.';
  }

  if (!unidade_medida || !unidade_medida.trim()) {
    return 'Informe a unidade de medida.';
  }

  if (
    quantidade_minima === '' ||
    quantidade_minima === undefined ||
    Number(quantidade_minima) <= 0 ||
    !Number.isInteger(Number(quantidade_minima))
  ) {
    return 'A quantidade mínima deve ser um número inteiro maior que zero.';
  }

  if (!id_categoria) {
    return 'Selecione uma categoria.';
  }

  return null;
}

// CADASTRAR PRODUTO
app.post('/api/produtos', async (req, res) => {
  const erroValidacao = validarProduto(req.body);

  if (erroValidacao) {
    return res.status(400).json({
      mensagem: erroValidacao
    });
  }

  const {
    nome_item,
    tamanho,
    unidade_medida,
    quantidade_minima,
    id_categoria
  } = req.body;

  try {
    const [categoria] = await pool.query(
      'SELECT id_categoria FROM categoria_item WHERE id_categoria = ?',
      [id_categoria]
    );

    if (categoria.length === 0) {
      return res.status(400).json({
        mensagem: 'Categoria inválida.'
      });
    }

    const [resultado] = await pool.query(
      `INSERT INTO item_doacao
      (nome_item, tamanho, unidade_medida, quantidade_minima, id_categoria)
      VALUES (?, ?, ?, ?, ?)`,
      [
        nome_item.trim(),
        tamanho?.trim() || null,
        unidade_medida.trim(),
        Number(quantidade_minima),
        id_categoria
      ]
    );

    res.status(201).json({
      id_item: resultado.insertId,
      mensagem: 'Produto cadastrado com sucesso.'
    });
  } catch (erro) {
    res.status(500).json({
      mensagem: 'Erro ao cadastrar produto.'
    });
  }
});

// EDITAR PRODUTO
app.put('/api/produtos/:id', async (req, res) => {
  const erroValidacao = validarProduto(req.body);

  if (erroValidacao) {
    return res.status(400).json({
      mensagem: erroValidacao
    });
  }

  const {
    nome_item,
    tamanho,
    unidade_medida,
    quantidade_minima,
    id_categoria
  } = req.body;

  try {
    const [categoria] = await pool.query(
      'SELECT id_categoria FROM categoria_item WHERE id_categoria = ?',
      [id_categoria]
    );

    if (categoria.length === 0) {
      return res.status(400).json({
        mensagem: 'Categoria inválida.'
      });
    }

    const [resultado] = await pool.query(
      `UPDATE item_doacao
       SET nome_item = ?,
           tamanho = ?,
           unidade_medida = ?,
           quantidade_minima = ?,
           id_categoria = ?
       WHERE id_item = ?`,
      [
        nome_item.trim(),
        tamanho?.trim() || null,
        unidade_medida.trim(),
        Number(quantidade_minima),
        id_categoria,
        req.params.id
      ]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        mensagem: 'Produto não encontrado.'
      });
    }

    res.json({
      mensagem: 'Produto atualizado com sucesso.'
    });
  } catch (erro) {
    res.status(500).json({
      mensagem: 'Erro ao atualizar produto.'
    });
  }
});

// EXCLUIR PRODUTO
app.delete('/api/produtos/:id', async (req, res) => {
  try {
    const [resultado] = await pool.query(
      'DELETE FROM item_doacao WHERE id_item = ?',
      [req.params.id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        mensagem: 'Produto não encontrado.'
      });
    }

    res.json({
      mensagem: 'Produto excluído com sucesso.'
    });
  } catch (erro) {
    if (erro.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({
        mensagem:
          'Este produto já está sendo usado em outro registro e não pode ser excluído.'
      });
    }

    res.status(500).json({
      mensagem: 'Erro ao excluir produto.'
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});