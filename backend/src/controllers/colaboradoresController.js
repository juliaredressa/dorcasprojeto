const db = require('../db');

exports.listar = (req, res) => {

    const sql = `
        SELECT
            p.id_pessoa,
            p.nome,
            p.cpf,
            p.telefone,
            p.email,
            p.endereco,
            f.cargo,
            f.matricula,
            f.data_admissao
        FROM pessoa p
        INNER JOIN funcionario f
            ON p.id_pessoa = f.id_pessoa
        ORDER BY p.nome
    `;

    db.query(sql, (err, results) => {

        if (err) {
            return res.status(500).json({
                erro: 'Erro ao listar colaboradores'
            });
        }

        res.json(results);
    });
};


exports.cadastrar = (req, res) => {

    const {
        nome,
        cpf,
        telefone,
        email,
        endereco,
        cargo,
        matricula,
        data_admissao
    } = req.body;

    if (
        !nome ||
        !cpf ||
        !cargo ||
        !matricula ||
        !data_admissao
    ) {
        return res.status(400).json({
            erro: 'Preencha os campos obrigatórios'
        });
    }

    db.beginTransaction(err => {

        if (err) {
            return res.status(500).json({
                erro: 'Erro na transação'
            });
        }

        const sqlPessoa = `
            INSERT INTO pessoa
            (nome, cpf, telefone, email, endereco)
            VALUES (?, ?, ?, ?, ?)
        `;

        db.query(
            sqlPessoa,
            [nome, cpf, telefone, email, endereco],
            (err, result) => {

                if (err) {

                    return db.rollback(() => {
                        res.status(400).json({
                            erro: 'Erro ao cadastrar pessoa',
                            detalhe: err.message
                        });
                    });

                }

                const idPessoa = result.insertId;

                const sqlFuncionario = `
                    INSERT INTO funcionario
                    (
                        id_pessoa,
                        cargo,
                        matricula,
                        data_admissao
                    )
                    VALUES (?, ?, ?, ?)
                `;

                db.query(
                    sqlFuncionario,
                    [
                        idPessoa,
                        cargo,
                        matricula,
                        data_admissao
                    ],
                    err => {

                        if (err) {

                            return db.rollback(() => {
                                res.status(400).json({
                                    erro: 'Erro ao cadastrar colaborador',
                                    detalhe: err.message
                                });
                            });

                        }

                        db.commit(err => {

                            if (err) {

                                return db.rollback(() => {
                                    res.status(500).json({
                                        erro: 'Erro ao finalizar cadastro'
                                    });
                                });

                            }

                            res.status(201).json({
                                mensagem: 'Colaborador cadastrado',
                                id_pessoa: idPessoa
                            });

                        });

                    }
                );

            }
        );

    });
};


exports.editar = (req, res) => {

    const { id } = req.params;

    const {
        nome,
        cpf,
        telefone,
        email,
        endereco,
        cargo,
        matricula,
        data_admissao
    } = req.body;

    const sqlPessoa = `
        UPDATE pessoa
        SET nome = ?,
            cpf = ?,
            telefone = ?,
            email = ?,
            endereco = ?
        WHERE id_pessoa = ?
    `;

    db.query(
        sqlPessoa,
        [
            nome,
            cpf,
            telefone,
            email,
            endereco,
            id
        ],
        err => {

            if (err) {
                return res.status(400).json({
                    erro: 'Erro ao atualizar pessoa',
                    detalhe: err.message
                });
            }

            const sqlFuncionario = `
                UPDATE funcionario
                SET cargo = ?,
                    matricula = ?,
                    data_admissao = ?
                WHERE id_pessoa = ?
            `;

            db.query(
                sqlFuncionario,
                [
                    cargo,
                    matricula,
                    data_admissao,
                    id
                ],
                err => {

                    if (err) {
                        return res.status(400).json({
                            erro: 'Erro ao atualizar colaborador'
                        });
                    }

                    res.json({
                        mensagem: 'Colaborador atualizado'
                    });

                }
            );

        }
    );
};


exports.excluir = (req, res) => {

    const { id } = req.params;

    db.query(
        'DELETE FROM funcionario WHERE id_pessoa = ?',
        [id],
        err => {

            if (err) {
                return res.status(400).json({
                    erro: 'Erro ao excluir colaborador',
                    detalhe: err.message
                });
            }

            db.query(
                'DELETE FROM pessoa WHERE id_pessoa = ?',
                [id],
                err => {

                    if (err) {
                        return res.status(400).json({
                            erro: 'Erro ao excluir pessoa',
                            detalhe: err.message
                        });
                    }

                    res.json({
                        mensagem: 'Colaborador excluído'
                    });

                }
            );

        }
    );
};