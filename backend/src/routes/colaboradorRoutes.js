const express = require("express");

const router = express.Router();

const {
    listarColaboradores,
    buscarColaborador,
    cadastrarColaborador,
    atualizarColaborador,
    excluirColaborador
} = require("../controllers/colaboradorController");


router.get("/", listarColaboradores);

router.get("/:id", buscarColaborador);

router.post("/", cadastrarColaborador);

router.put("/:id", atualizarColaborador);

router.delete("/:id", excluirColaborador);


module.exports = router;