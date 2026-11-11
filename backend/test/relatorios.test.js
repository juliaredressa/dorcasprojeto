const { test } = require("node:test");
const assert = require("node:assert/strict");
const database = require("../src/database");
const {
    relatorioPartosProximos,
    relatorioEstoque,
    relatorioHistoricoDoacoes
} = require("../src/controllers/relatoriosController");
const requireRoleAccess = require("../src/middleware/roleAccess");

function createResponse() {
    return {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        }
    };
}

test("relatório de partos aplica período padrão e só consulta partos próximos ativos", async (t) => {
    let sql;
    t.mock.method(database, "promise", () => ({
        query: async (query) => {
            sql = query;
            return [[{ id_gestante: 12, dias_para_parto: 5 }], []];
        }
    }));

    const res = createResponse();
    await relatorioPartosProximos({ query: {} }, res);

    assert.match(sql, /g\.dpp <= DATE_ADD\(CURDATE\(\), INTERVAL 30 DAY\)/);
    assert.match(sql, /UPPER\(TRIM\(g\.situacao\)\) = 'ATIVA'/);
    assert.equal(res.body.dias, 30);
    assert.equal(res.body.quantidade, 1);
});

test("relatório de partos valida o período antes da consulta", async (t) => {
    t.mock.method(database, "promise", () => {
        throw new Error("A consulta não deveria ser chamada.");
    });

    const res = createResponse();
    await relatorioPartosProximos({ query: { dias: "366" } }, res);

    assert.equal(res.statusCode, 400);
    assert.match(res.body.erro, /entre 0 e 365/);
});

test("relatório de estoque calcula as faixas incluindo itens sem saldo", async (t) => {
    t.mock.method(database, "promise", () => ({
        query: async () => [[
            { id_item: 1, quantidade_atual: 0, quantidade_minima: 2 },
            { id_item: 2, quantidade_atual: 1, quantidade_minima: 2 },
            { id_item: 3, quantidade_atual: 2, quantidade_minima: 2 }
        ], []]
    }));

    const res = createResponse();
    await relatorioEstoque({}, res);

    assert.deepEqual(res.body.resumo, {
        total_itens: 3,
        itens_sem_estoque: 1,
        itens_abaixo_minimo: 1,
        itens_adequados: 1
    });
    assert.deepEqual(res.body.itens.map(({ situacao }) => situacao), [
        "SEM_ESTOQUE",
        "ABAIXO_MINIMO",
        "ADEQUADO"
    ]);
});

test("histórico de doações filtra, pagina e associa itens a cada doação", async (t) => {
    const queries = [];
    t.mock.method(database, "promise", () => ({
        query: async (sql, parameters) => {
            queries.push({ sql, parameters });
            if (sql.includes("COUNT(*)")) {
                return [[{ total: 3 }], []];
            }
            if (sql.includes("item_doacao_recebida")) {
                return [[{ id_doacao: 8, id_item: 2, nome_item: "Fralda", quantidade: 4 }], []];
            }
            return [[{
                id_doacao: 8,
                data_doacao: "2026-10-10",
                nome_funcionario: "Equipe",
                nome_doador: null,
                nome_evento: null
            }], []];
        }
    }));

    const res = createResponse();
    await relatorioHistoricoDoacoes({
        query: {
            data_inicio: "2026-10-01",
            data_fim: "2026-10-31",
            pagina: "2",
            limite: "1"
        }
    }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(queries.length, 3);
    assert.deepEqual(queries[0].parameters, ["2026-10-01", "2026-10-31"]);
    assert.deepEqual(queries[1].parameters, ["2026-10-01", "2026-10-31", 1, 1]);
    assert.equal(res.body.paginacao.total_paginas, 3);
    assert.deepEqual(res.body.doacoes[0].itens, [
        { id_item: 2, nome_item: "Fralda", quantidade: 4 }
    ]);
});

test("histórico rejeita datas inválidas ou intervalos invertidos", async (t) => {
    t.mock.method(database, "promise", () => {
        throw new Error("A consulta não deveria ser chamada.");
    });

    const invalidDate = createResponse();
    await relatorioHistoricoDoacoes({
        query: { data_inicio: "2026-02-30" }
    }, invalidDate);
    assert.equal(invalidDate.statusCode, 400);

    const invertedDates = createResponse();
    await relatorioHistoricoDoacoes({
        query: { data_inicio: "2026-10-31", data_fim: "2026-10-01" }
    }, invertedDates);
    assert.equal(invertedDates.statusCode, 400);
});

test("perfil de assistente social acessa partos próximos, mas não estoque nem doações", () => {
    const request = (url) => ({
        session: { usuario: { cargo: "Assistente social", is_admin: false } },
        originalUrl: url,
        method: "GET"
    });
    const result = () => ({
        statusCode: 200,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json() {}
    });

    let nextCalled = false;
    requireRoleAccess(request("/api/relatorios/partos-proximos"), result(), () => {
        nextCalled = true;
    });
    assert.equal(nextCalled, true);

    const stockRes = result();
    requireRoleAccess(request("/api/relatorios/estoque"), stockRes, () => {});
    assert.equal(stockRes.statusCode, 403);
});
