const express = require('express');

const router = express.Router();

const {
  listarProdutos,
  buscarProduto,
  cadastrarProduto,
  atualizarProduto,
  excluirProduto
} = require('../controllers/produtoController');

router.get('/', listarProdutos);
router.get('/:id', buscarProduto);
router.post('/', cadastrarProduto);
router.put('/:id', atualizarProduto);
router.delete('/:id', excluirProduto);

module.exports = router;