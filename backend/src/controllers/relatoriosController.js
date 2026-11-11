const db = require("../database");

function parseInteger(value, defaultValue, minimum, maximum, field) {
    if (value === undefined) {
        return defaultValue;
    }

    if (
        typeof value !== "string" ||
        !/^\d+$/.test(value) ||
        Number(value) < minimum ||
        Number(value) > maximum
    ) {
        throw new Error(`O parâmetro ${field} deve ser um inteiro entre ${minimum} e ${maximum}.`);
    }

    return Number(value);
}

function parseDate(value, field) {
    if (value === undefined) {
        return null;
    }

    if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) !== value
    ) {
        throw new Error(`O parâmetro ${field} deve ser uma data válida no formato AAAA-MM-DD.`);
    }

    return value;
}

const relatorioPartosProximos = async (req, res) => {
    let dias;
    try {
        dias = parseInteger(req.query.dias, 30, 0, 365, "dias");
    } catch (erro) {
        return res.status(400).json({ erro: erro.message });
    }

    try {
        const [partos] = await db.promise().query(`
            SELECT
                g.id_pessoa AS id_gestante,
                p.nome AS nome_gestante,
                p.telefone,
                g.dpp,
                DATEDIFF(g.dpp, CURDATE()) AS dias_para_parto,
                g.grau_vulnerabilidade
            FROM gestante g
            INNER JOIN pessoa p
                ON p.id_pessoa = g.id_pessoa
            WHERE UPPER(TRIM(g.situacao)) = 'ATIVA'
                AND g.dpp >= CURDATE()
                AND g.dpp <= DATE_ADD(CURDATE(), INTERVAL ${dias} DAY)
            ORDER BY g.dpp, p.nome
        `);

        return res.json({
            gerado_em: new Date().toISOString(),
            dias,
            quantidade: partos.length,
            partos
        });
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ erro: "Erro ao emitir relatório de partos próximos." });
    }
};

const relatorioEstoque = async (req, res) => {
    try {
        const [itens] = await db.promise().query(`
            SELECT
                i.id_item,
                i.nome_item,
                i.tamanho,
                i.unidade_medida,
                i.quantidade_minima,
                c.id_categoria,
                c.nome_categoria,
                COALESCE(e.quantidade_atual, 0) AS quantidade_atual,
                e.local_armazenamento
            FROM item_doacao i
            INNER JOIN categoria_item c
                ON c.id_categoria = i.id_categoria
            LEFT JOIN estoque e
                ON e.id_item = i.id_item
            ORDER BY c.nome_categoria, i.nome_item, i.tamanho
        `);

        let itensSemEstoque = 0;
        let itensAbaixoMinimo = 0;
        let itensAdequados = 0;

        const itensRelatorio = itens.map((item) => {
            const quantidade = Number(item.quantidade_atual);
            const minimo = Number(item.quantidade_minima);
            let situacao;

            if (quantidade === 0) {
                situacao = "SEM_ESTOQUE";
                itensSemEstoque += 1;
            } else if (quantidade < minimo) {
                situacao = "ABAIXO_MINIMO";
                itensAbaixoMinimo += 1;
            } else {
                situacao = "ADEQUADO";
                itensAdequados += 1;
            }

            return { ...item, quantidade_atual: quantidade, situacao };
        });

        return res.json({
            gerado_em: new Date().toISOString(),
            resumo: {
                total_itens: itens.length,
                itens_sem_estoque: itensSemEstoque,
                itens_abaixo_minimo: itensAbaixoMinimo,
                itens_adequados: itensAdequados
            },
            itens: itensRelatorio
        });
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ erro: "Erro ao emitir relatório de estoque." });
    }
};

const relatorioHistoricoDoacoes = async (req, res) => {
    let dataInicio;
    let dataFim;
    let pagina;
    let limite;

    try {
        dataInicio = parseDate(req.query.data_inicio, "data_inicio");
        dataFim = parseDate(req.query.data_fim, "data_fim");
        pagina = parseInteger(req.query.pagina, 1, 1, Number.MAX_SAFE_INTEGER, "pagina");
        limite = parseInteger(req.query.limite, 100, 1, 500, "limite");

        if (dataInicio && dataFim && dataInicio > dataFim) {
            throw new Error("data_inicio não pode ser posterior a data_fim.");
        }
    } catch (erro) {
        return res.status(400).json({ erro: erro.message });
    }

    const conditions = [];
    const parameters = [];
    if (dataInicio) {
        conditions.push("d.data_doacao >= ?");
        parameters.push(dataInicio);
    }
    if (dataFim) {
        conditions.push("d.data_doacao <= ?");
        parameters.push(dataFim);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const offset = (pagina - 1) * limite;

    try {
        const conexao = db.promise();
        const [[countRows], [doacoes]] = await Promise.all([
            conexao.query(`
                SELECT COUNT(*) AS total
                FROM doacao d
                ${where}
            `, parameters),
            conexao.query(`
                SELECT
                    d.id_doacao,
                    d.data_doacao,
                    d.id_funcionario,
                    pf.nome AS nome_funcionario,
                    d.id_doador,
                    pd.nome AS nome_doador,
                    d.id_evento,
                    e.nome_evento
                FROM doacao d
                INNER JOIN funcionario f
                    ON f.id_pessoa = d.id_funcionario
                INNER JOIN pessoa pf
                    ON pf.id_pessoa = f.id_pessoa
                LEFT JOIN doador dr
                    ON dr.id_pessoa = d.id_doador
                LEFT JOIN pessoa pd
                    ON pd.id_pessoa = dr.id_pessoa
                LEFT JOIN evento e
                    ON e.id_evento = d.id_evento
                ${where}
                ORDER BY d.data_doacao DESC, d.id_doacao DESC
                LIMIT ? OFFSET ?
            `, [...parameters, limite, offset])
        ]);

        const idsDoacao = doacoes.map(({ id_doacao }) => id_doacao);
        let itens = [];
        if (idsDoacao.length > 0) {
            [itens] = await conexao.query(`
                SELECT
                    r.id_doacao,
                    r.id_item,
                    i.nome_item,
                    r.quantidade
                FROM item_doacao_recebida r
                INNER JOIN item_doacao i
                    ON i.id_item = r.id_item
                WHERE r.id_doacao IN (?)
                ORDER BY r.id_doacao, i.nome_item
            `, [idsDoacao]);
        }

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

        const total = Number(countRows[0].total);
        return res.json({
            gerado_em: new Date().toISOString(),
            filtros: { data_inicio: dataInicio, data_fim: dataFim },
            paginacao: {
                pagina,
                limite,
                total,
                total_paginas: Math.ceil(total / limite)
            },
            doacoes: doacoes.map((doacao) => ({
                ...doacao,
                itens: itensPorDoacao.get(doacao.id_doacao) || []
            }))
        });
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ erro: "Erro ao emitir relatório de histórico de doações." });
    }
};

module.exports = {
    relatorioPartosProximos,
    relatorioEstoque,
    relatorioHistoricoDoacoes
};
