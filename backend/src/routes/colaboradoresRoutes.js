const express = require('express');

const router = express.Router();

const controller =
    require('../controllers/colaboradoresController');

router.get('/', controller.listar);
router.post('/', controller.cadastrar);
router.put('/:id', controller.editar);
router.delete('/:id', controller.excluir);

module.exports = router;