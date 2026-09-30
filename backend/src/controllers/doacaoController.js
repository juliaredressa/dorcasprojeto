const db = require("../database");

// LISTAR TODAS AS DOAÇÕES
const listarDoacoes = (req, res) => {
    const sql = `
        SELECT
            d.id_doacao,
            d.data_doacao,
            d.id_doador,
            pd.nome AS nome_doador,
            d.id_funcionario,
            pf.nome AS nome_funcionario
        FROM doacao d
        INNER JOIN doador doad
            ON d.id_doador = doad.id_pessoa
        INNER JOIN pessoa pd
            ON doad.id_pessoa = pd.id_pessoa
        INNER JOIN funcionario f
            ON d.id_funcionario = f.id_pessoa
        INNER JOIN pessoa pf
            ON f.id_pessoa = pf.id_pessoa
        ORDER BY d.data_doacao DESC
    `;

    db.query(sql, (erro, resultados) => {
        if (erro) {
            return res.status(500).json({
                erro: "Erro ao listar doações."
            });
        }

        res.json(resultados);
    });
};


// BUSCAR DOAÇÃO POR ID
const buscarDoacao = (req, res) => {
    const { id } = req.params;

    const sqlDoacao = `
        SELECT
            d.id_doacao,
            d.data_doacao,
            d.id_doador,
            pd.nome AS nome_doador,
            d.id_funcionario,
            pf.nome AS nome_funcionario
        FROM doacao d
        INNER JOIN doador doad
            ON d.id_doador = doad.id_pessoa
        INNER JOIN pessoa pd
            ON doad.id_pessoa = pd.id_pessoa
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
        id_doador,
        id_funcionario,
        itens
    } = req.body;

    if (
        !data_doacao ||
        !id_doador ||
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

        // Verificar doador
        const [doadores] = await conexao.query(
            `
            SELECT id_pessoa
            FROM doador
            WHERE id_pessoa = ?
            `,
            [id_doador]
        );

        if (doadores.length === 0) {
            await conexao.rollback();

            return res.status(404).json({
                erro: "Doador não encontrado."
            });
        }

        // Verificar funcionário
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

        // Registrar a doação
        const [resultadoDoacao] = await conexao.query(
            `
            INSERT INTO doacao
            (
                data_doacao,
                id_doador,
                id_funcionario
            )
            VALUES (?, ?, ?)
            `,
            [
                data_doacao,
                id_doador,
                id_funcionario
            ]
        );

        const idDoacao = resultadoDoacao.insertId;

        // Registrar os itens recebidos
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
                    Number(item.quantidade)
                ]
            );
        }

        await conexao.commit();

        res.status(201).json({
            mensagem: "Doação cadastrada com sucesso!",
            id_doacao: idDoacao
        });

    } catch (erro) {
        await conexao.rollback();

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao cadastrar doação."
        });
    }
};


// EXCLUIR DOAÇÃO
const excluirDoacao = async (req, res) => {
    const { id } = req.params;

    const conexao = db.promise();

    try {
        await conexao.beginTransaction();

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

        await conexao.query(
            `
            DELETE FROM item_doacao_recebida
            WHERE id_doacao = ?
            `,
            [id]
        );

        await conexao.query(
            `
            DELETE FROM doacao
            WHERE id_doacao = ?
            `,
            [id]
        );

        await conexao.commit();

        res.json({
            mensagem: "Doação excluída com sucesso!"
        });

    } catch (erro) {
        await conexao.rollback();

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao excluir doação."
        });
    }
};


module.exports = {
    listarDoacoes,
    buscarDoacao,
    cadastrarDoacao,
    excluirDoacao
};
