const express = require('express');

const router = express.Router();

const {
    login,
    verificarLogin,
    logout,
    alterarSenha
} = require("../controllers/loginController");

router.post("/login", login);
router.get("/verificar", verificarLogin);
router.post("/logout", logout);
router.put("/senha", alterarSenha);

module.exports = router;