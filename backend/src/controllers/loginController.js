const bcrypt = require("bcrypt");
const pool = require("../databasePool");

// LOGIN
const login = async (req, res) => {
    const { login, senha } = req.body;

    if (!login || !senha) {
        return res.status(400).json({
            mensagem: "Login e senha são obrigatórios."
        });
    }

    try {
        const [usuarios] = await pool.query(
            `
            SELECT
                u.id_usuario,
                u.login,
                u.senha,
                f.id_pessoa AS id_funcionario,
                p.nome,
                f.cargo,
                f.matricula
            FROM usuario u
            INNER JOIN funcionario f
                ON f.id_pessoa = u.id_funcionario
            INNER JOIN pessoa p
                ON p.id_pessoa = f.id_pessoa
            WHERE u.login = ?
            `,
            [login]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({
                mensagem: "Login ou senha inválidos."
            });
        }

        const usuario = usuarios[0];

        const senhaCorreta = await bcrypt.compare(
            senha,
            usuario.senha
        );

        if (!senhaCorreta) {
            return res.status(401).json({
                mensagem: "Login ou senha inválidos."
            });
        }

        req.session.usuario = {
            id_usuario: usuario.id_usuario,
            login: usuario.login,
            id_funcionario: usuario.id_funcionario,
            nome: usuario.nome,
            cargo: usuario.cargo,
            matricula: usuario.matricula
        };

        res.json({
            mensagem: "Login realizado com sucesso.",
            usuario: req.session.usuario
        });

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            mensagem: "Erro ao realizar login."
        });
    }
};


// VERIFICAR LOGIN
const verificarLogin = (req, res) => {

    if (!req.session.usuario) {
        return res.status(401).json({
            logado: false,
            mensagem: "Usuário não está logado."
        });
    }

    res.json({
        logado: true,
        usuario: req.session.usuario
    });
};


// LOGOUT
const logout = (req, res) => {

    req.session.destroy((erro) => {

        if (erro) {
            console.error(erro);

            return res.status(500).json({
                mensagem: "Erro ao sair do sistema."
            });
        }

        res.clearCookie("connect.sid");

        res.json({
            mensagem: "Logout realizado com sucesso."
        });
    });
};


// ALTERAR SENHA
const alterarSenha = async (req, res) => {

    if (!req.session.usuario) {
        return res.status(401).json({
            mensagem: "Você precisa estar logado."
        });
    }

    const {
        senhaAtual,
        novaSenha
    } = req.body;

    if (!senhaAtual || !novaSenha) {
        return res.status(400).json({
            mensagem: "Senha atual e nova senha são obrigatórias."
        });
    }

    if (novaSenha.length < 6) {
        return res.status(400).json({
            mensagem: "A nova senha deve ter pelo menos 6 caracteres."
        });
    }

    try {

        const [usuarios] = await pool.query(
            `
            SELECT senha
            FROM usuario
            WHERE id_usuario = ?
            `,
            [req.session.usuario.id_usuario]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                mensagem: "Usuário não encontrado."
            });
        }

        const senhaCorreta = await bcrypt.compare(
            senhaAtual,
            usuarios[0].senha
        );

        if (!senhaCorreta) {
            return res.status(401).json({
                mensagem: "Senha atual incorreta."
            });
        }

        const novaSenhaCriptografada =
            await bcrypt.hash(novaSenha, 10);

        await pool.query(
            `
            UPDATE usuario
            SET senha = ?
            WHERE id_usuario = ?
            `,
            [
                novaSenhaCriptografada,
                req.session.usuario.id_usuario
            ]
        );

        res.json({
            mensagem: "Senha alterada com sucesso."
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            mensagem: "Erro ao alterar senha."
        });
    }
};


module.exports = {
    login,
    verificarLogin,
    logout,
    alterarSenha
};