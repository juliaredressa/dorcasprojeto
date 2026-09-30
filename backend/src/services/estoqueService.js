// Adiciona quantidade ao estoque
const adicionarAoEstoque = async (conexao, idItem, quantidade) => {
    await conexao.query(
        `
        INSERT INTO estoque
            (quantidade_atual, id_item)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE
            quantidade_atual = quantidade_atual + VALUES(quantidade_atual)
        `,
        [quantidade, idItem]
    );

    await conexao.query(
        `
        INSERT INTO movimentacao_estoque
            (tipo_movimentacao, data_movimentacao, quantidade, id_item)
        VALUES ('ENTRADA', NOW(), ?, ?)
        `,
        [quantidade, idItem]
    );
};


// Retira quantidade do estoque
const retirarDoEstoque = async (conexao, idItem, quantidade) => {
    const [estoques] = await conexao.query(
        `
        SELECT quantidade_atual
        FROM estoque
        WHERE id_item = ?
        `,
        [idItem]
    );

    if (estoques.length === 0) {
        throw new Error(`Não existe estoque para o item ${idItem}.`);
    }

    if (estoques[0].quantidade_atual < quantidade) {
        throw new Error(`Estoque insuficiente para o item ${idItem}.`);
    }

    await conexao.query(
        `
        UPDATE estoque
        SET quantidade_atual = quantidade_atual - ?
        WHERE id_item = ?
        `,
        [quantidade, idItem]
    );

    await conexao.query(
        `
        INSERT INTO movimentacao_estoque
            (tipo_movimentacao, data_movimentacao, quantidade, id_item)
        VALUES ('SAIDA', NOW(), ?, ?)
        `,
        [quantidade, idItem]
    );
};


module.exports = {
    adicionarAoEstoque,
    retirarDoEstoque
};
