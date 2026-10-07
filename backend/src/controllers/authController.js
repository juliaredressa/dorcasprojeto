const db = require('../db');
const bcrypt = require('bcrypt');

exports.login = (req, res) => {

    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({
            erro: 'Informe e-mail e senha'
        });
    }

    const sql = `
        SELECT
            u.id_usuario,
            u.email,
            u.senha,
            p.nome
        FROM usuario u
        INNER JOIN pessoa p
            ON u.id_pessoa = p.id_pessoa
        WHERE u.email = ?
    `;

    db.query(sql, [email], async (err, results) => {

        if (err) {
            return res.status(500).json({
                erro: 'Erro no login'
            });
        }

        if (results.length === 0) {
            return res.status(401).json({
                erro: 'E-mail ou senha inválidos'
            });
        }

        const usuario = results[0];

        const senhaValida =
            await bcrypt.compare(senha, usuario.senha);

        if (!senhaValida) {
            return res.status(401).json({
                erro: 'E-mail ou senha inválidos'
            });
        }

        res.json({
            mensagem: 'Login realizado',
            usuario: {
                id_usuario: usuario.id_usuario,
                nome: usuario.nome,
                email: usuario.email
            }
        });

    });
};


exports.alterarSenha = async (req, res) => {

    const { id_usuario, senhaAtual, novaSenha } = req.body;

    if (!id_usuario || !senhaAtual || !novaSenha) {
        return res.status(400).json({
            erro: 'Preencha todos os campos'
        });
    }

    db.query(
        'SELECT senha FROM usuario WHERE id_usuario = ?',
        [id_usuario],
        async (err, results) => {

            if (err) {
                return res.status(500).json({
                    erro: 'Erro ao consultar usuário'
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    erro: 'Usuário não encontrado'
                });
            }

            const senhaValida =
                await bcrypt.compare(
                    senhaAtual,
                    results[0].senha
                );

            if (!senhaValida) {
                return res.status(401).json({
                    erro: 'Senha atual incorreta'
                });
            }

            const novaSenhaHash =
                await bcrypt.hash(novaSenha, 10);

            db.query(
                'UPDATE usuario SET senha = ? WHERE id_usuario = ?',
                [novaSenhaHash, id_usuario],
                err => {

                    if (err) {
                        return res.status(500).json({
                            erro: 'Erro ao alterar senha'
                        });
                    }

                    res.json({
                        mensagem: 'Senha alterada com sucesso'
                    });

                }
            );

        }
    );
};