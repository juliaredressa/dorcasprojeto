const db = require("../database");

const {
    retirarDoEstoque,
    adicionarAoEstoque
} = require("../services/estoqueService");


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
            pf.nome AS nome_funcionario,
            k.id_evento,
            e.nome_evento
        FROM kit_maternidade k
        INNER JOIN gestante g
            ON k.id_gestante = g.id_pessoa
        INNER JOIN pessoa pg
            ON g.id_pessoa = pg.id_pessoa
        INNER JOIN funcionario f
            ON k.id_funcionario = f.id_pessoa
        INNER JOIN pessoa pf
            ON f.id_pessoa = pf.id_pessoa
        LEFT JOIN evento e
            ON e.id_evento = k.id_evento
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
            pf.nome AS nome_funcionario,
            k.id_evento,
            e.nome_evento
        FROM kit_maternidade k
        INNER JOIN gestante g
            ON k.id_gestante = g.id_pessoa
        INNER JOIN pessoa pg
            ON g.id_pessoa = pg.id_pessoa
        INNER JOIN funcionario f
            ON k.id_funcionario = f.id_pessoa
        INNER JOIN pessoa pf
            ON f.id_pessoa = pf.id_pessoa
        LEFT JOIN evento e
            ON e.id_evento = k.id_evento
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
        id_evento,
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

        if (id_evento) {
            const [eventos] = await conexao.query(
                "SELECT id_evento FROM evento WHERE id_evento = ?",
                [id_evento]
            );
            if (eventos.length === 0) {
                await conexao.rollback();
                return res.status(404).json({ erro: "Evento não encontrado." });
            }
        }

        // VERIFICAR TODOS OS ITENS ANTES DE CRIAR O KIT
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
                id_funcionario,
                id_evento
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                data_montagem || null,
                status,
                data_entrega || null,
                id_gestante,
                id_funcionario,
                id_evento || null
            ]
        );

        const idKit = resultadoKit.insertId;

        // CADASTRAR ITENS E RETIRAR DO ESTOQUE
        for (const item of itens) {
            const quantidade = Number(item.quantidade);

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
                    quantidade
                ]
            );

            await retirarDoEstoque(
                conexao,
                item.id_item,
                quantidade
            );
        }

        await conexao.commit();

        res.status(201).json({
            mensagem: "Kit cadastrado com sucesso e estoque atualizado!",
            id_kit: idKit
        });

    } catch (erro) {
        await conexao.rollback();

        console.error(erro);

        res.status(400).json({
            erro: erro.message
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

        // VERIFICAR KIT
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

        // BUSCAR ITENS DO KIT
        const [itens] = await conexao.query(
            `
            SELECT
                id_item,
                quantidade
            FROM item_kit
            WHERE id_kit = ?
            `,
            [id]
        );

        // DEVOLVER OS ITENS AO ESTOQUE
        for (const item of itens) {
            await adicionarAoEstoque(
                conexao,
                item.id_item,
                item.quantidade
            );
        }

        // EXCLUIR ITENS DO KIT
        await conexao.query(
            `
            DELETE FROM item_kit
            WHERE id_kit = ?
            `,
            [id]
        );

        // EXCLUIR KIT
        await conexao.query(
            `
            DELETE FROM kit_maternidade
            WHERE id_kit = ?
            `,
            [id]
        );

        await conexao.commit();

        res.json({
            mensagem: "Kit excluído e itens devolvidos ao estoque!"
        });

    } catch (erro) {
        await conexao.rollback();

        console.error(erro);

        res.status(400).json({
            erro: erro.message
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
