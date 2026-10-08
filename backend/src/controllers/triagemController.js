const db = require("../database");

// LISTAR TODAS AS TRIAGENS
const listarTriagens = (req, res) => {
    const sql = `
        SELECT
            t.id_triagem,
            t.data_triagem,
            t.nota_vulnerabilidade,
            t.observacoes,
            t.id_gestante,
            p.nome AS nome_gestante,
            t.id_funcionario
        FROM triagem_social t
        INNER JOIN gestante g
            ON t.id_gestante = g.id_pessoa
        INNER JOIN pessoa p
            ON g.id_pessoa = p.id_pessoa
        ORDER BY t.data_triagem DESC
    `;

    db.query(sql, (erro, resultados) => {
        if (erro) {
            return res.status(500).json({
                erro: "Erro ao listar triagens."
            });
        }

        res.json(resultados);
    });
};


// BUSCAR TRIAGEM POR ID
const buscarTriagem = (req, res) => {
    const { id } = req.params;

    const sql = `
        SELECT
            t.id_triagem,
            t.data_triagem,
            t.nota_vulnerabilidade,
            t.observacoes,
            t.id_gestante,
            p.nome AS nome_gestante,
            t.id_funcionario
        FROM triagem_social t
        INNER JOIN gestante g
            ON t.id_gestante = g.id_pessoa
        INNER JOIN pessoa p
            ON g.id_pessoa = p.id_pessoa
        WHERE t.id_triagem = ?
    `;

    db.query(sql, [id], (erro, resultados) => {
        if (erro) {
            return res.status(500).json({
                erro: "Erro ao buscar triagem."
            });
        }

        if (resultados.length === 0) {
            return res.status(404).json({
                erro: "Triagem não encontrada."
            });
        }

        res.json(resultados[0]);
    });
};


// CADASTRAR TRIAGEM
const cadastrarTriagem = (req, res) => {
    const {
        data_triagem,
        nota_vulnerabilidade,
        observacoes,
        id_gestante,
        id_funcionario
    } = req.body;

    if (
        !data_triagem ||
        nota_vulnerabilidade === undefined ||
        !id_gestante ||
        !id_funcionario
    ) {
        return res.status(400).json({
            erro: "Preencha todos os campos obrigatórios."
        });
    }

    if (nota_vulnerabilidade < 1 || nota_vulnerabilidade > 5) {
        return res.status(400).json({
            erro: "A nota de vulnerabilidade deve estar entre 1 e 5."
        });
    }

    const verificarGestante = `
        SELECT id_pessoa
        FROM gestante
        WHERE id_pessoa = ?
    `;

    db.query(verificarGestante, [id_gestante], (erro, gestantes) => {
        if (erro) {
            return res.status(500).json({
                erro: "Erro ao verificar gestante."
            });
        }

        if (gestantes.length === 0) {
            return res.status(404).json({
                erro: "Gestante não encontrada."
            });
        }

        const verificarFuncionario = `
            SELECT id_pessoa
            FROM funcionario
            WHERE id_pessoa = ?
        `;

        db.query(verificarFuncionario, [id_funcionario], (erro, funcionarios) => {
            if (erro) {
                return res.status(500).json({
                    erro: "Erro ao verificar funcionário."
                });
            }

            if (funcionarios.length === 0) {
                return res.status(404).json({
                    erro: "Funcionário não encontrado."
                });
            }

            const sql = `
                INSERT INTO triagem_social
                (
                    data_triagem,
                    nota_vulnerabilidade,
                    observacoes,
                    id_gestante,
                    id_funcionario
                )
                VALUES (?, ?, ?, ?, ?)
            `;

            db.query(
                sql,
                [
                    data_triagem,
                    nota_vulnerabilidade,
                    observacoes || null,
                    id_gestante,
                    id_funcionario
                ],
                (erro, resultado) => {
                    if (erro) {
                        return res.status(500).json({
                            erro: "Erro ao cadastrar triagem."
                        });
                    }

                    res.status(201).json({
                        mensagem: "Triagem cadastrada com sucesso!",
                        id_triagem: resultado.insertId
                    });
                }
            );
        });
    });
};


// ATUALIZAR TRIAGEM
const atualizarTriagem = (req, res) => {
    const { id } = req.params;

    const {
        data_triagem,
        nota_vulnerabilidade,
        observacoes,
        id_gestante,
        id_funcionario
    } = req.body;

    if (
        !data_triagem ||
        nota_vulnerabilidade === undefined ||
        !id_gestante ||
        !id_funcionario
    ) {
        return res.status(400).json({
            erro: "Preencha todos os campos obrigatórios."
        });
    }

    if (nota_vulnerabilidade < 1 || nota_vulnerabilidade > 5) {
        return res.status(400).json({
            erro: "A nota de vulnerabilidade deve estar entre 1 e 5."
        });
    }

    const sql = `
        UPDATE triagem_social
        SET
            data_triagem = ?,
            nota_vulnerabilidade = ?,
            observacoes = ?,
            id_gestante = ?,
            id_funcionario = ?
        WHERE id_triagem = ?
    `;

    db.query(
        sql,
        [
            data_triagem,
            nota_vulnerabilidade,
            observacoes || null,
            id_gestante,
            id_funcionario,
            id
        ],
        (erro, resultado) => {
            if (erro) {
                return res.status(500).json({
                    erro: "Erro ao atualizar triagem."
                });
            }

            if (resultado.affectedRows === 0) {
                return res.status(404).json({
                    erro: "Triagem não encontrada."
                });
            }

            res.json({
                mensagem: "Triagem atualizada com sucesso!"
            });
        }
    );
};


// EXCLUIR TRIAGEM
const excluirTriagem = (req, res) => {
    const { id } = req.params;

    const sql = `
        DELETE FROM triagem_social
        WHERE id_triagem = ?
    `;

    db.query(sql, [id], (erro, resultado) => {
        if (erro) {
            return res.status(500).json({
                erro: "Erro ao excluir triagem."
            });
        }

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                erro: "Triagem não encontrada."
            });
        }

        res.json({
            mensagem: "Triagem excluída com sucesso!"
        });
    });
};


module.exports = {
    listarTriagens,
    buscarTriagem,
    cadastrarTriagem,
    atualizarTriagem,
    excluirTriagem
};
