const bcrypt = require("bcrypt");
const pool = require("../databasePool");

const listarColaboradoresDisponiveis = async (req, res) => {
    try {
        const [colaboradores] = await pool.query(
            `SELECT f.id_pessoa, p.nome, f.matricula
             FROM funcionario f
             INNER JOIN pessoa p ON p.id_pessoa = f.id_pessoa
             LEFT JOIN usuario u ON u.id_funcionario = f.id_pessoa
             WHERE u.id_usuario IS NULL
             ORDER BY p.nome`
        );

        res.json(colaboradores);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({
            mensagem: "Não foi possível listar colaboradores disponíveis."
        });
    }
};

const cadastrarUsuario = async (req, res) => {
    const idFuncionario = Number(req.body.id_funcionario);
    const login = typeof req.body.login === "string" ? req.body.login.trim() : "";
    const senha = req.body.senha;

    if (!Number.isInteger(idFuncionario) || idFuncionario < 1 || !login || !senha) {
        return res.status(400).json({
            mensagem: "Selecione um colaborador e informe login e senha."
        });
    }

    if (login.length > 100) {
        return res.status(400).json({
            mensagem: "O login deve ter no máximo 100 caracteres."
        });
    }

    if (typeof senha !== "string" || senha.length < 6) {
        return res.status(400).json({
            mensagem: "A senha deve ter pelo menos 6 caracteres."
        });
    }

    let connection;
    try {
        const senhaHash = await bcrypt.hash(senha, 10);
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [colaboradores] = await connection.query(
            `SELECT f.id_pessoa
             FROM funcionario f
             WHERE f.id_pessoa = ?
             FOR UPDATE`,
            [idFuncionario]
        );

        if (colaboradores.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                mensagem: "O colaborador selecionado não foi encontrado."
            });
        }

        const [usuariosExistentes] = await connection.query(
            "SELECT id_usuario FROM usuario WHERE id_funcionario = ?",
            [idFuncionario]
        );
        if (usuariosExistentes.length > 0) {
            await connection.rollback();
            return res.status(409).json({
                mensagem: "Este colaborador já possui uma conta de acesso."
            });
        }

        const [resultado] = await connection.query(
            "INSERT INTO usuario (id_funcionario, login, senha) VALUES (?, ?, ?)",
            [idFuncionario, login, senhaHash]
        );
        await connection.commit();

        res.status(201).json({
            mensagem: "Conta criada com sucesso. Agora você já pode entrar.",
            id_usuario: resultado.insertId,
            login
        });
    } catch (erro) {
        if (connection) {
            await connection.rollback().catch((erroRollback) => {
                console.error(erroRollback);
            });
        }
        if (erro.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                mensagem: "Este login já está em uso."
            });
        }
        console.error(erro);
        res.status(500).json({
            mensagem: "Não foi possível criar a conta."
        });
    } finally {
        if (connection) connection.release();
    }
};

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
                u.is_admin,
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

        const dadosUsuario = {
            id_usuario: usuario.id_usuario,
            login: usuario.login,
            id_funcionario: usuario.id_funcionario,
            nome: usuario.nome,
            cargo: usuario.cargo,
            matricula: usuario.matricula,
            is_admin: Boolean(usuario.is_admin)
        };

        req.session.regenerate((erroSessao) => {
            if (erroSessao) {
                console.error(erroSessao);
                return res.status(500).json({
                    mensagem: "Erro ao iniciar a sessão."
                });
            }

            req.session.usuario = dadosUsuario;
            req.session.save((erroSalvamento) => {
                if (erroSalvamento) {
                    console.error(erroSalvamento);
                    return res.status(500).json({
                        mensagem: "Erro ao iniciar a sessão."
                    });
                }

                res.json({
                    mensagem: "Login realizado com sucesso.",
                    usuario: dadosUsuario
                });
            });
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

        res.clearCookie("connect.sid", { path: "/" });

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

    if (
        typeof senhaAtual !== "string" ||
        typeof novaSenha !== "string" ||
        !senhaAtual ||
        !novaSenha
    ) {
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
    listarColaboradoresDisponiveis,
    cadastrarUsuario,
    login,
    verificarLogin,
    logout,
    alterarSenha
};