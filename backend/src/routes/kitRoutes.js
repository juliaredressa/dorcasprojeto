const express = require("express");
const router = express.Router();

const {
    listarKits,
    buscarKit,
    cadastrarKit,
    atualizarKit,
    excluirKit
} = require("../controllers/kitController");

// GET - listar todos os kits
router.get("/", listarKits);

// GET - buscar kit por ID
router.get("/:id", buscarKit);

// POST - cadastrar novo kit
router.post("/", cadastrarKit);

// PUT - atualizar kit
router.put("/:id", atualizarKit);

// DELETE - excluir kit
router.delete("/:id", excluirKit);

module.exports = router;
