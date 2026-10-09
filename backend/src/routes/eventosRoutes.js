const express = require("express");
const controller = require("../controllers/eventosController");

const router = express.Router();

router.get("/", controller.listar);
router.get("/psicologos", controller.listarPsicologos);
router.get("/gestantes", controller.listarGestantes);
router.get("/kits", controller.listarKits);
router.get("/:id", controller.buscar);
router.post("/", controller.criar);
router.put("/:id", controller.atualizar);
router.delete("/:id", controller.excluir);
router.post("/:id/palestras", controller.adicionarPalestra);
router.delete("/:id/palestras/:idPalestra", controller.excluirPalestra);
router.put("/:id/participantes/:idGestante", controller.registrarParticipante);

module.exports = router;
