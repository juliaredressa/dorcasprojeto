const express = require("express");

const router = express.Router();

const {
    listarGestantes,
    buscarGestante,
    cadastrarGestante,
    atualizarGestante,
    excluirGestante
} = require("../controllers/gestanteController");

router.get("/", listarGestantes);
router.get("/:id", buscarGestante);
router.post("/", cadastrarGestante);
router.put("/:id", atualizarGestante);
router.delete("/:id", excluirGestante);

module.exports = router;