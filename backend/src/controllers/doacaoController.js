const db = require("../database");

const {
    adicionarAoEstoque
} = require("../services/estoqueService");

const listarItensDisponiveis = async (req, res) => {
    try {
        const [itens] = await db.promise().query(`
            SELECT
                i.id_item,
                i.nome_item,
                i.unidade_medida,
                e.quantidade_atual
            FROM item_doacao i
            INNER JOIN estoque e
                ON e.id_item = i.id_item
            WHERE e.quantidade_atual > 0
            ORDER BY i.nome_item
        `);

        res.json(itens);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({
            erro: "Erro ao listar itens com estoque disponível."
        });
    }
};


// LISTAR TODAS AS DOAÇÕES
const listarDoacoes = async (req, res) => {
    try {
        const conexao = db.promise();
        const [doacoes] = await conexao.query(`
            SELECT
                d.id_doacao,
                d.data_doacao,
                d.id_funcionario,
                pf.nome AS nome_funcionario
            FROM doacao d
            INNER JOIN funcionario f
                ON d.id_funcionario = f.id_pessoa
            INNER JOIN pessoa pf
                ON f.id_pessoa = pf.id_pessoa
            ORDER BY d.data_doacao DESC
        `);

        if (doacoes.length === 0) {
            return res.json([]);
        }

        const idsDoacao = doacoes.map(({ id_doacao }) => id_doacao);
        const [itens] = await conexao.query(`
            SELECT
                r.id_doacao,
                r.id_item,
                i.nome_item,
                r.quantidade
            FROM item_doacao_recebida r
            INNER JOIN item_doacao i
                ON r.id_item = i.id_item
            WHERE r.id_doacao IN (?)
            ORDER BY i.nome_item
        `, [idsDoacao]);

        const itensPorDoacao = new Map();
        for (const item of itens) {
            const itensDoacao = itensPorDoacao.get(item.id_doacao) || [];
            itensDoacao.push({
                id_item: item.id_item,
                nome_item: item.nome_item,
                quantidade: item.quantidade
            });
            itensPorDoacao.set(item.id_doacao, itensDoacao);
        }

        res.json(doacoes.map((doacao) => ({
            ...doacao,
            itens: itensPorDoacao.get(doacao.id_doacao) || []
        })));
    } catch (erro) {
        console.error(erro);
        res.status(500).json({
            erro: "Erro ao listar doações."
        });
    }
};


// BUSCAR DOAÇÃO POR ID
const buscarDoacao = (req, res) => {
    const { id } = req.params;

    const sqlDoacao = `
        SELECT
            d.id_doacao,
            d.data_doacao,
            d.id_funcionario,
            pf.nome AS nome_funcionario
        FROM doacao d
        INNER JOIN funcionario f
            ON d.id_funcionario = f.id_pessoa
        INNER JOIN pessoa pf
            ON f.id_pessoa = pf.id_pessoa
        WHERE d.id_doacao = ?
    `;

    db.query(sqlDoacao, [id], (erro, doacoes) => {
        if (erro) {
            return res.status(500).json({
                erro: "Erro ao buscar doação."
            });
        }

        if (doacoes.length === 0) {
            return res.status(404).json({
                erro: "Doação não encontrada."
            });
        }

        const sqlItens = `
            SELECT
                r.id_item,
                i.nome_item,
                r.quantidade
            FROM item_doacao_recebida r
            INNER JOIN item_doacao i
                ON r.id_item = i.id_item
            WHERE r.id_doacao = ?
        `;

        db.query(sqlItens, [id], (erro, itens) => {
            if (erro) {
                return res.status(500).json({
                    erro: "Erro ao buscar itens da doação."
                });
            }

            res.json({
                ...doacoes[0],
                itens
            });
        });
    });
};


// CADASTRAR DOAÇÃO
const cadastrarDoacao = async (req, res) => {
    const {
        data_doacao,
        id_funcionario,
        itens
    } = req.body;

    if (
        !data_doacao ||
        !id_funcionario ||
        !Array.isArray(itens) ||
        itens.length === 0
    ) {
        return res.status(400).json({
            erro: "Preencha os dados da doação e informe pelo menos um item."
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

        // REGISTRAR A DOAÇÃO
        const [resultadoDoacao] = await conexao.query(
            `
            INSERT INTO doacao
            (
                data_doacao,
                id_funcionario
            )
            VALUES (?, ?)
            `,
            [
                data_doacao,
                id_funcionario
            ]
        );

        const idDoacao = resultadoDoacao.insertId;

        // REGISTRAR OS ITENS RECEBIDOS
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

            const quantidade = Number(item.quantidade);

            // REGISTRAR ITEM DA DOAÇÃO
            await conexao.query(
                `
                INSERT INTO item_doacao_recebida
                (
                    id_doacao,
                    id_item,
                    quantidade
                )
                VALUES (?, ?, ?)
                `,
                [
                    idDoacao,
                    item.id_item,
                    quantidade
                ]
            );

            // ATUALIZAR ESTOQUE AUTOMATICAMENTE
            await adicionarAoEstoque(
                conexao,
                item.id_item,
                quantidade
            );
        }

        await conexao.commit();

        res.status(201).json({
            mensagem: "Doação cadastrada com sucesso e estoque atualizado!",
            id_doacao: idDoacao
        });

    } catch (erro) {
        await conexao.rollback();

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao cadastrar doação.",
            detalhe: erro.message
        });
    }
};


// EXCLUIR DOAÇÃO
const excluirDoacao = async (req, res) => {
    const { id } = req.params;

    const conexao = db.promise();

    try {
        await conexao.beginTransaction();

        // VERIFICAR SE A DOAÇÃO EXISTE
        const [doacoes] = await conexao.query(
            `
            SELECT id_doacao
            FROM doacao
            WHERE id_doacao = ?
            `,
            [id]
        );

        if (doacoes.length === 0) {
            await conexao.rollback();

            return res.status(404).json({
                erro: "Doação não encontrada."
            });
        }

        // BUSCAR OS ITENS DA DOAÇÃO
        const [itens] = await conexao.query(
            `
            SELECT
                id_item,
                quantidade
            FROM item_doacao_recebida
            WHERE id_doacao = ?
            `,
            [id]
        );

        // DEVOLVER AS QUANTIDADES AO ESTOQUE
        for (const item of itens) {
            await adicionarAoEstoque(
                conexao,
                item.id_item,
                item.quantidade
            );
        }

        // EXCLUIR OS ITENS DA DOAÇÃO
        await conexao.query(
            `
            DELETE FROM item_doacao_recebida
            WHERE id_doacao = ?
            `,
            [id]
        );

        // EXCLUIR A DOAÇÃO
        await conexao.query(
            `
            DELETE FROM doacao
            WHERE id_doacao = ?
            `,
            [id]
        );

        await conexao.commit();

        res.json({
            mensagem: "Doação excluída e estoque atualizado com sucesso!"
        });

    } catch (erro) {
        await conexao.rollback();

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao excluir doação.",
            detalhe: erro.message
        });
    }
};


module.exports = {
    listarItensDisponiveis,
    listarDoacoes,
    buscarDoacao,
    cadastrarDoacao,
    excluirDoacao
};
