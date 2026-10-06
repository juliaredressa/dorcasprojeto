const express = require("express");

const router = express.Router();

const {
    entradaEstoque,
    saidaEstoque
} = require("../controllers/estoqueController");


// Registrar entrada de item no estoque
router.post("/entrada", entradaEstoque);


// Registrar saída de item do estoque
router.post("/saida", saidaEstoque);


module.exports = router;
