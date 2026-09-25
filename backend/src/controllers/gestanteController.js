const db = require("../database");

// LISTAR TODAS
const listarGestantes = (req, res) => {
    const sql = `
        SELECT
            g.id_pessoa,
            p.nome,
            p.cpf,
            p.data_nascimento,
            p.telefone,
            p.endereco,
            g.dpp,
            g.grau_vulnerabilidade,
            g.data_cadastro,
            g.situacao
        FROM gestante g
        INNER JOIN pessoa p
            ON g.id_pessoa = p.id_pessoa
        ORDER BY p.nome
    `;

    db.query(sql, (erro, resultados) => {
        if (erro) {
            return res.status(500).json({
                erro: "Erro ao listar gestantes."
            });
        }

        res.json(resultados);
    });
};


// BUSCAR POR ID
const buscarGestante = (req, res) => {
    const { id } = req.params;

    const sql = `
        SELECT
            g.id_pessoa,
            p.nome,
            p.cpf,
            p.data_nascimento,
            p.telefone,
            p.endereco,
            g.dpp,
            g.grau_vulnerabilidade,
            g.data_cadastro,
            g.situacao
        FROM gestante g
        INNER JOIN pessoa p
            ON g.id_pessoa = p.id_pessoa
        WHERE g.id_pessoa = ?
    `;

    db.query(sql, [id], (erro, resultados) => {
        if (erro) {
            return res.status(500).json({
                erro: "Erro ao buscar gestante."
            });
        }

        if (resultados.length === 0) {
            return res.status(404).json({
                erro: "Gestante não encontrada."
            });
        }

        res.json(resultados[0]);
    });
};


// CADASTRAR
const cadastrarGestante = (req, res) => {
    const {
        id_pessoa,
        dpp,
        grau_vulnerabilidade,
        data_cadastro,
        situacao
    } = req.body;

    if (
        !id_pessoa ||
        !dpp ||
        grau_vulnerabilidade === undefined ||
        !data_cadastro ||
        !situacao
    ) {
        return res.status(400).json({
            erro: "Todos os campos são obrigatórios."
        });
    }

    if (grau_vulnerabilidade < 1 || grau_vulnerabilidade > 5) {
        return res.status(400).json({
            erro: "O grau de vulnerabilidade deve estar entre 1 e 5."
        });
    }

    const verificarPessoa = `
        SELECT id_pessoa
        FROM pessoa
        WHERE id_pessoa = ?
    `;

    db.query(verificarPessoa, [id_pessoa], (erro, pessoas) => {
        if (erro) {
            return res.status(500).json({
                erro: "Erro ao verificar pessoa."
            });
        }

        if (pessoas.length === 0) {
            return res.status(404).json({
                erro: "Pessoa não encontrada."
            });
        }

        const verificarGestante = `
            SELECT id_pessoa
            FROM gestante
            WHERE id_pessoa = ?
        `;

        db.query(verificarGestante, [id_pessoa], (erro, gestantes) => {
            if (erro) {
                return res.status(500).json({
                    erro: "Erro ao verificar gestante."
                });
            }

            if (gestantes.length > 0) {
                return res.status(400).json({
                    erro: "Esta pessoa já está cadastrada como gestante."
                });
            }

            const sql = `
                INSERT INTO gestante
                (
                    id_pessoa,
                    dpp,
                    grau_vulnerabilidade,
                    data_cadastro,
                    situacao
                )
                VALUES (?, ?, ?, ?, ?)
            `;

            db.query(
                sql,
                [
                    id_pessoa,
                    dpp,
                    grau_vulnerabilidade,
                    data_cadastro,
                    situacao
                ],
                (erro) => {
                    if (erro) {
                        return res.status(500).json({
                            erro: "Erro ao cadastrar gestante."
                        });
                    }

                    res.status(201).json({
                        mensagem: "Gestante cadastrada com sucesso!"
                    });
                }
            );
        });
    });
};


// ATUALIZAR
const atualizarGestante = (req, res) => {
    const { id } = req.params;

    const {
        dpp,
        grau_vulnerabilidade,
        data_cadastro,
        situacao
    } = req.body;

    if (
        !dpp ||
        grau_vulnerabilidade === undefined ||
        !data_cadastro ||
        !situacao
    ) {
        return res.status(400).json({
            erro: "Todos os campos são obrigatórios."
        });
    }

    if (grau_vulnerabilidade < 1 || grau_vulnerabilidade > 5) {
        return res.status(400).json({
            erro: "O grau de vulnerabilidade deve estar entre 1 e 5."
        });
    }

    const sql = `
        UPDATE gestante
        SET
            dpp = ?,
            grau_vulnerabilidade = ?,
            data_cadastro = ?,
            situacao = ?
        WHERE id_pessoa = ?
    `;

    db.query(
        sql,
        [
            dpp,
            grau_vulnerabilidade,
            data_cadastro,
            situacao,
            id
        ],
        (erro, resultado) => {
            if (erro) {
                return res.status(500).json({
                    erro: "Erro ao atualizar gestante."
                });
            }

            if (resultado.affectedRows === 0) {
                return res.status(404).json({
                    erro: "Gestante não encontrada."
                });
            }

            res.json({
                mensagem: "Gestante atualizada com sucesso!"
            });
        }
    );
};


// EXCLUIR
const excluirGestante = (req, res) => {
    const { id } = req.params;

    const sql = `
        DELETE FROM gestante
        WHERE id_pessoa = ?
    `;

    db.query(sql, [id], (erro, resultado) => {
        if (erro) {
            return res.status(500).json({
                erro: "Erro ao excluir gestante."
            });
        }

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                erro: "Gestante não encontrada."
            });
        }

        res.json({
            mensagem: "Gestante excluída com sucesso!"
        });
    });
};


module.exports = {
    listarGestantes,
    buscarGestante,
    cadastrarGestante,
    atualizarGestante,
    excluirGestante
};