const db = require('../db');

exports.listar = (req, res) => {

    const sql = `
        SELECT
            i.id_item,
            i.nome_item,
            i.tamanho,
            i.unidade_medida,
            i.quantidade_minima,
            i.id_categoria,
            c.nome_categoria,
            e.quantidade_atual,
            e.local_armazenamento
        FROM item_doacao i
        INNER JOIN categoria_item c
            ON i.id_categoria = c.id_categoria
        LEFT JOIN estoque e
            ON i.id_item = e.id_item
        ORDER BY i.nome_item
    `;

    db.query(sql, (err, results) => {

        if (err) {
            return res.status(500).json({
                erro: 'Erro ao listar produtos',
                detalhe: err.message
            });
        }

        res.json(results);

    });
};


exports.categorias = (req, res) => {

    db.query(
        'SELECT * FROM categoria_item ORDER BY nome_categoria',
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    erro: 'Erro ao listar categorias'
                });
            }

            res.json(results);
        }
    );
};


exports.cadastrar = (req, res) => {

    const {
        nome_item,
        tamanho,
        unidade_medida,
        quantidade_minima,
        id_categoria,
        quantidade_atual,
        local_armazenamento
    } = req.body;

    if (
        !nome_item ||
        !unidade_medida ||
        quantidade_minima === undefined ||
        !id_categoria
    ) {
        return res.status(400).json({
            erro: 'Preencha os campos obrigatórios'
        });
    }

    const sql = `
        INSERT INTO item_doacao
        (
            nome_item,
            tamanho,
            unidade_medida,
            quantidade_minima,
            id_categoria
        )
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            nome_item,
            tamanho,
            unidade_medida,
            quantidade_minima,
            id_categoria
        ],
        (err, result) => {

            if (err) {
                return res.status(400).json({
                    erro: 'Erro ao cadastrar produto',
                    detalhe: err.message
                });
            }

            const idItem = result.insertId;

            const sqlEstoque = `
                INSERT INTO estoque
                (
                    quantidade_atual,
                    local_armazenamento,
                    id_item
                )
                VALUES (?, ?, ?)
            `;

            db.query(
                sqlEstoque,
                [
                    quantidade_atual || 0,
                    local_armazenamento || '',
                    idItem
                ],
                (err) => {

                    if (err) {
                        return res.status(400).json({
                            erro: 'Produto criado, mas erro ao criar estoque',
                            detalhe: err.message
                        });
                    }

                    res.status(201).json({
                        mensagem: 'Produto cadastrado com sucesso',
                        id_item: idItem
                    });

                }
            );

        }
    );
};


exports.editar = (req, res) => {

    const { id } = req.params;

    const {
        nome_item,
        tamanho,
        unidade_medida,
        quantidade_minima,
        id_categoria,
        quantidade_atual,
        local_armazenamento
    } = req.body;

    const sql = `
        UPDATE item_doacao
        SET nome_item = ?,
            tamanho = ?,
            unidade_medida = ?,
            quantidade_minima = ?,
            id_categoria = ?
        WHERE id_item = ?
    `;

    db.query(
        sql,
        [
            nome_item,
            tamanho,
            unidade_medida,
            quantidade_minima,
            id_categoria,
            id
        ],
        (err) => {

            if (err) {
                return res.status(400).json({
                    erro: 'Erro ao atualizar produto',
                    detalhe: err.message
                });
            }

            const sqlEstoque = `
                UPDATE estoque
                SET quantidade_atual = ?,
                    local_armazenamento = ?
                WHERE id_item = ?
            `;

            db.query(
                sqlEstoque,
                [
                    quantidade_atual || 0,
                    local_armazenamento || '',
                    id
                ],
                (err) => {

                    if (err) {
                        return res.status(400).json({
                            erro: 'Erro ao atualizar estoque',
                            detalhe: err.message
                        });
                    }

                    res.json({
                        mensagem: 'Produto atualizado com sucesso'
                    });

                }
            );

        }
    );
};


exports.excluir = (req, res) => {

    const { id } = req.params;

    db.query(
        'DELETE FROM estoque WHERE id_item = ?',
        [id],
        (err) => {

            if (err) {
                return res.status(400).json({
                    erro: 'Erro ao excluir estoque'
                });
            }

            db.query(
                'DELETE FROM item_doacao WHERE id_item = ?',
                [id],
                (err) => {

                    if (err) {
                        return res.status(400).json({
                            erro: 'Não foi possível excluir o produto',
                            detalhe: err.message
                        });
                    }

                    res.json({
                        mensagem: 'Produto excluído com sucesso'
                    });

                }
            );

        }
    );
};