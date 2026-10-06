const express = require("express");
const router = express.Router();

const {
    listarFila,
    buscarFila,
    adicionarFila,
    atualizarFila,
    excluirFila
} = require("../controllers/filaPrioridadeController");


// GET - listar fila completa
router.get("/", listarFila);

// GET - buscar registro da fila
router.get("/:id", buscarFila);

// POST - adicionar gestante na fila
router.post("/", adicionarFila);

// PUT - atualizar posição da fila
router.put("/:id", atualizarFila);

// DELETE - remover da fila
router.delete("/:id", excluirFila);


module.exports = router;
