const express = require("express");

const {
    relatorioPartosProximos,
    relatorioEstoque,
    relatorioHistoricoDoacoes
} = require("../controllers/relatoriosController");

const router = express.Router();

router.get("/partos-proximos", relatorioPartosProximos);
router.get("/estoque", relatorioEstoque);
router.get("/historico-doacoes", relatorioHistoricoDoacoes);

module.exports = router;
