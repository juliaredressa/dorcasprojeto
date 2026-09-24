const express = require("express");

const router = express.Router();

const {
    listarGestantes,
    buscarGestante,
    cadastrarGestante,
    atualizarGestante,
    excluirGestante
} = require("../controllers/gestanteController");


// GET - listar
router.get("/", listarGestantes);

// GET - buscar uma
router.get("/:id", buscarGestante);

// POST - cadastrar
router.post("/", cadastrarGestante);

// PUT - atualizar
router.put("/:id", atualizarGestante);

// DELETE - excluir
router.delete("/:id", excluirGestante);

module.exports = router;