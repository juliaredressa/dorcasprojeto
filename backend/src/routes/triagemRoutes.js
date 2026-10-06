const express = require("express");
const router = express.Router();

const {
    listarTriagens,
    buscarTriagem,
    cadastrarTriagem,
    atualizarTriagem,
    excluirTriagem
} = require("../controllers/triagemController");

// GET - listar todas
router.get("/", listarTriagens);

// GET - buscar uma
router.get("/:id", buscarTriagem);

// POST - cadastrar
router.post("/", cadastrarTriagem);

// PUT - atualizar
router.put("/:id", atualizarTriagem);

// DELETE - excluir
router.delete("/:id", excluirTriagem);

module.exports = router;
