const express = require("express");

const router = express.Router();

const {
    listarColaboradoresDisponiveis,
    cadastrarUsuario,
    login,
    verificarLogin,
    logout,
    alterarSenha
} = require("../controllers/loginController");

router.get("/colaboradores-disponiveis", listarColaboradoresDisponiveis);
router.post("/cadastro", cadastrarUsuario);
router.post("/", login);

router.get("/verificar", verificarLogin);

router.post("/logout", logout);

router.put("/alterar-senha", alterarSenha);

module.exports = router;