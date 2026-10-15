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
    const [resultado] = await conexao.query(
        `UPDATE estoque
         SET quantidade_atual = quantidade_atual - ?
         WHERE id_item = ? AND quantidade_atual >= ?`,
        [quantidade, idItem, quantidade]
    );

    if (resultado.affectedRows !== 1) {
        const erro = new Error(`Estoque insuficiente para o item ${idItem}.`);
        erro.code = 'ESTOQUE_INSUFICIENTE';
        throw erro;
    }

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
