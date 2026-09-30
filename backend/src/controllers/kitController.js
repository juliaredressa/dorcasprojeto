const db = require("../database");

// LISTAR TODOS OS KITS
const listarKits = (req, res) => {
    const sql = `
        SELECT
            k.id_kit,
            k.data_montagem,
            k.status,
            k.data_entrega,
            k.id_gestante,
            pg.nome AS nome_gestante,
            k.id_funcionario,
            pf.nome AS nome_funcionario
        FROM kit_maternidade k
        INNER JOIN gestante g
            ON k.id_gestante = g.id_pessoa
        INNER JOIN pessoa pg
            ON g.id_pessoa = pg.id_pessoa
        INNER JOIN funcionario f
            ON k.id_funcionario = f.id_pessoa
        INNER JOIN pessoa pf
            ON f.id_pessoa = pf.id_pessoa
        ORDER BY k.id_kit DESC
    `;

    db.query(sql, (erro, resultados) => {
        if (erro) {
            return res.status(500).json({
                erro: "Erro ao listar kits."
            });
        }

        res.json(resultados);
    });
};


// BUSCAR KIT POR ID
const buscarKit = (req, res) => {
    const { id } = req.params;

    const sqlKit = `
        SELECT
            k.id_kit,
            k.data_montagem,
            k.status,
            k.data_entrega,
            k.id_gestante,
            pg.nome AS nome_gestante,
            k.id_funcionario,
            pf.nome AS nome_funcionario
        FROM kit_maternidade k
        INNER JOIN gestante g
            ON k.id_gestante = g.id_pessoa
        INNER JOIN pessoa pg
            ON g.id_pessoa = pg.id_pessoa
        INNER JOIN funcionario f
            ON k.id_funcionario = f.id_pessoa
        INNER JOIN pessoa pf
            ON f.id_pessoa = pf.id_pessoa
        WHERE k.id_kit = ?
    `;

    db.query(sqlKit, [id], (erro, kits) => {
        if (erro) {
            return res.status(500).json({
                erro: "Erro ao buscar kit."
            });
        }

        if (kits.length === 0) {
            return res.status(404).json({
                erro: "Kit não encontrado."
            });
        }

        const sqlItens = `
            SELECT
                ik.id_item,
                i.nome_item,
                ik.quantidade
            FROM item_kit ik
            INNER JOIN item_doacao i
                ON ik.id_item = i.id_item
            WHERE ik.id_kit = ?
        `;

        db.query(sqlItens, [id], (erro, itens) => {
            if (erro) {
                return res.status(500).json({
                    erro: "Erro ao buscar itens do kit."
                });
            }

            res.json({
                ...kits[0],
                itens
            });
        });
    });
};


// CADASTRAR KIT
const cadastrarKit = async (req, res) => {
    const {
        data_montagem,
        status,
        data_entrega,
        id_gestante,
        id_funcionario,
        itens
    } = req.body;

    if (
        !status ||
        !id_gestante ||
        !id_funcionario ||
        !Array.isArray(itens) ||
        itens.length === 0
    ) {
        return res.status(400).json({
            erro: "Preencha os campos obrigatórios e informe pelo menos um item."
        });
    }

    for (const item of itens) {
        if (
            !item.id_item ||
            !Number.isInteger(Number(item.quantidade)) ||
            Number(item.quantidade) <= 0
        ) {
            return res.status(400).json({
                erro: "Todos os itens devem possuir id e quantidade maior que zero."
            });
        }
    }

    const conexao = db.promise();

    try {
        await conexao.beginTransaction();

        // VERIFICAR GESTANTE
        const [gestantes] = await conexao.query(
            `
            SELECT id_pessoa
            FROM gestante
            WHERE id_pessoa = ?
            `,
            [id_gestante]
        );

        if (gestantes.length === 0) {
            await conexao.rollback();

            return res.status(404).json({
                erro: "Gestante não encontrada."
            });
        }

        // VERIFICAR FUNCIONÁRIO
        const [funcionarios] = await conexao.query(
            `
            SELECT id_pessoa
            FROM funcionario
            WHERE id_pessoa = ?
            `,
            [id_funcionario]
        );

        if (funcionarios.length === 0) {
            await conexao.rollback();

            return res.status(404).json({
                erro: "Funcionário não encontrado."
            });
        }

        // CADASTRAR KIT
        const [resultadoKit] = await conexao.query(
            `
            INSERT INTO kit_maternidade
            (
                data_montagem,
                status,
                data_entrega,
                id_gestante,
                id_funcionario
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                data_montagem || null,
                status,
                data_entrega || null,
                id_gestante,
                id_funcionario
            ]
        );

        const idKit = resultadoKit.insertId;

        // CADASTRAR ITENS DO KIT
        for (const item of itens) {
            const [itensEncontrados] = await conexao.query(
                `
                SELECT id_item
                FROM item_doacao
                WHERE id_item = ?
                `,
                [item.id_item]
            );

            if (itensEncontrados.length === 0) {
                await conexao.rollback();

                return res.status(404).json({
                    erro: `Item ${item.id_item} não encontrado.`
                });
            }

            await conexao.query(
                `
                INSERT INTO item_kit
                (
                    id_kit,
                    id_item,
                    quantidade
                )
                VALUES (?, ?, ?)
                `,
                [
                    idKit,
                    item.id_item,
                    Number(item.quantidade)
                ]
            );
        }

        await conexao.commit();

        res.status(201).json({
            mensagem: "Kit cadastrado com sucesso!",
            id_kit: idKit
        });

    } catch (erro) {
        await conexao.rollback();

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao cadastrar kit."
        });
    }
};


// ATUALIZAR STATUS DO KIT
const atualizarKit = (req, res) => {
    const { id } = req.params;

    const {
        status,
        data_entrega
    } = req.body;

    if (!status) {
        return res.status(400).json({
            erro: "O status é obrigatório."
        });
    }

    const sql = `
        UPDATE kit_maternidade
        SET
            status = ?,
            data_entrega = ?
        WHERE id_kit = ?
    `;

    db.query(
        sql,
        [
            status,
            data_entrega || null,
            id
        ],
        (erro, resultado) => {
            if (erro) {
                return res.status(500).json({
                    erro: "Erro ao atualizar kit."
                });
            }

            if (resultado.affectedRows === 0) {
                return res.status(404).json({
                    erro: "Kit não encontrado."
                });
            }

            res.json({
                mensagem: "Kit atualizado com sucesso!"
            });
        }
    );
};


// EXCLUIR KIT
const excluirKit = async (req, res) => {
    const { id } = req.params;

    const conexao = db.promise();

    try {
        await conexao.beginTransaction();

        const [kits] = await conexao.query(
            `
            SELECT id_kit
            FROM kit_maternidade
            WHERE id_kit = ?
            `,
            [id]
        );

        if (kits.length === 0) {
            await conexao.rollback();

            return res.status(404).json({
                erro: "Kit não encontrado."
            });
        }

        await conexao.query(
            `
            DELETE FROM item_kit
            WHERE id_kit = ?
            `,
            [id]
        );

        await conexao.query(
            `
            DELETE FROM kit_maternidade
            WHERE id_kit = ?
            `,
            [id]
        );

        await conexao.commit();

        res.json({
            mensagem: "Kit excluído com sucesso!"
        });

    } catch (erro) {
        await conexao.rollback();

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao excluir kit."
        });
    }
};


module.exports = {
    listarKits,
    buscarKit,
    cadastrarKit,
    atualizarKit,
    excluirKit
};
