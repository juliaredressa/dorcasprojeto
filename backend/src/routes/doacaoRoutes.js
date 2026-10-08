const express = require("express");
const router = express.Router();

const {
    listarItensDisponiveis,
    listarDoacoes,
    buscarDoacao,
    cadastrarDoacao,
    excluirDoacao
} = require("../controllers/doacaoController");

// GET - listar itens com estoque disponível para o cadastro de doações
router.get("/itens-disponiveis", listarItensDisponiveis);

// GET - listar todas as doações
router.get("/", listarDoacoes);

// GET - buscar doação por ID
router.get("/:id", buscarDoacao);

// POST - cadastrar nova doação
router.post("/", cadastrarDoacao);

// DELETE - excluir doação
router.delete("/:id", excluirDoacao);

module.exports = router;
