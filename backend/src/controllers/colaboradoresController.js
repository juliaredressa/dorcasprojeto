const db = require('../db');
const pool = require('../databasePool');

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

exports.buscar = (req, res) => {
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
        WHERE p.id_pessoa = ?
    `;

    db.query(sql, [req.params.id], (err, results) => {
        if (err) {
            return res.status(500).json({ erro: 'Erro ao buscar colaborador' });
        }
        if (results.length === 0) {
            return res.status(404).json({ erro: 'Colaborador não encontrado' });
        }
        res.json(results[0]);
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

    db.getConnection((connectionError, connection) => {
        if (connectionError) {
            return res.status(500).json({
                erro: 'Erro na transação'
            });
        }

        connection.beginTransaction(err => {
            if (err) {
                connection.release();
                return res.status(500).json({
                    erro: 'Erro na transação'
                });
            }

        const sqlPessoa = `
            INSERT INTO pessoa
            (nome, cpf, telefone, email, endereco)
            VALUES (?, ?, ?, ?, ?)
        `;

        connection.query(
            sqlPessoa,
            [nome, cpf, telefone, email, endereco],
            (err, result) => {

                if (err) {

                    return connection.rollback(() => {
                        connection.release();
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

                connection.query(
                    sqlFuncionario,
                    [
                        idPessoa,
                        cargo,
                        matricula,
                        data_admissao
                    ],
                    err => {

                        if (err) {

                            return connection.rollback(() => {
                                connection.release();
                                res.status(400).json({
                                    erro: 'Erro ao cadastrar colaborador',
                                    detalhe: err.message
                                });
                            });

                        }

                        connection.commit(err => {

                            if (err) {

                                return connection.rollback(() => {
                                    connection.release();
                                    res.status(500).json({
                                        erro: 'Erro ao finalizar cadastro'
                                    });
                                });

                            }

                            connection.release();
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

    if (!nome || !cpf || !cargo || !matricula || !data_admissao) {
        return res.status(400).json({ erro: 'Preencha os campos obrigatórios' });
    }
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


exports.excluir = async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({
            mensagem: 'O identificador do colaborador é inválido.'
        });
    }

    if (req.session?.usuario?.id_funcionario === id) {
        return res.status(409).json({
            mensagem: 'Não é possível excluir o colaborador da sessão atual.'
        });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [colaboradores] = await connection.query(
            'SELECT id_pessoa FROM funcionario WHERE id_pessoa = ? FOR UPDATE',
            [id]
        );
        if (colaboradores.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                mensagem: 'Colaborador não encontrado.'
            });
        }

        await connection.query(
            'DELETE FROM usuario WHERE id_funcionario = ?',
            [id]
        );
        await connection.query(
            'DELETE FROM funcionario WHERE id_pessoa = ?',
            [id]
        );
        await connection.query(
            'DELETE FROM pessoa WHERE id_pessoa = ?',
            [id]
        );
        await connection.commit();

        res.json({
            mensagem: 'Colaborador e sua conta de acesso foram excluídos.'
        });
    } catch (erro) {
        if (connection) {
            await connection.rollback().catch((erroRollback) => {
                console.error(erroRollback);
            });
        }

        if (erro.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({
                mensagem: 'Este colaborador possui registros vinculados (como doações, kits ou triagens) e não pode ser excluído para preservar o histórico.'
            });
        }

        console.error(erro);
        res.status(500).json({
            mensagem: 'Não foi possível excluir o colaborador.'
        });
    } finally {
        if (connection) connection.release();
    }
};