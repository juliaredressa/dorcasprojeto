const db = require("../database");
const {
    adicionarAoEstoque,
    retirarDoEstoque
} = require("../services/estoqueService");


// ENTRADA DE ESTOQUE
const entradaEstoque = async (req, res) => {
    const { id_item, quantidade } = req.body;

    if (!id_item || !quantidade) {
        return res.status(400).json({
            erro: "Informe o item e a quantidade."
        });
    }

    try {
        await adicionarAoEstoque(db.promise(), id_item, quantidade);

        res.json({
            mensagem: "Estoque atualizado com sucesso!"
        });

    } catch (erro) {
        res.status(500).json({
            erro: erro.message
        });
    }
};


// SAÍDA DE ESTOQUE
const saidaEstoque = async (req, res) => {
    const { id_item, quantidade } = req.body;

    if (!id_item || !quantidade) {
        return res.status(400).json({
            erro: "Informe o item e a quantidade."
        });
    }

    try {
        await retirarDoEstoque(db.promise(), id_item, quantidade);

        res.json({
            mensagem: "Saída de estoque realizada com sucesso!"
        });

    } catch (erro) {
        res.status(400).json({
            erro: erro.message
        });
    }
};


module.exports = {
    entradaEstoque,
    saidaEstoque
};
