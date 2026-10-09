const express = require('express');
const router = express.Router();

const controller = require('../controllers/produtosController');

router.get('/', controller.listar);
router.get('/categorias', controller.categorias);
router.get('/:id', controller.buscar);
router.post('/', controller.cadastrar);
router.put('/:id', controller.editar);
router.delete('/:id', controller.excluir);

module.exports = router;