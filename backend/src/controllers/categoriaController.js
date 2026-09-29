const pool = require('../databasePool');

const listarCategorias = async (req, res) => {
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
};

module.exports = {
  listarCategorias
};