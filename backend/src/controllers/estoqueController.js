const db = require("../database");

const {
    adicionarAoEstoque,
    retirarDoEstoque
} = require("../services/estoqueService");


// ENTRADA DE ESTOQUE
const entradaEstoque = async (req, res) => {
    const { id_item, quantidade } = req.body;

    if (
        !id_item ||
        quantidade === undefined ||
        !Number.isInteger(Number(quantidade)) ||
        Number(quantidade) <= 0
    ) {
        return res.status(400).json({
            erro: "Informe um item e uma quantidade inteira maior que zero."
        });
    }

    try {
        await adicionarAoEstoque(
            db.promise(),
            id_item,
            Number(quantidade)
        );

        res.json({
            mensagem: "Estoque atualizado com sucesso!"
        });

    } catch (erro) {
        console.error(erro);

        res.status(400).json({
            erro: erro.message
        });
    }
};


// SAÍDA DE ESTOQUE
const saidaEstoque = async (req, res) => {
    const { id_item, quantidade } = req.body;

    if (
        !id_item ||
        quantidade === undefined ||
        !Number.isInteger(Number(quantidade)) ||
        Number(quantidade) <= 0
    ) {
        return res.status(400).json({
            erro: "Informe um item e uma quantidade inteira maior que zero."
        });
    }

    try {
        await retirarDoEstoque(
            db.promise(),
            id_item,
            Number(quantidade)
        );

        res.json({
            mensagem: "Saída de estoque realizada com sucesso!"
        });

    } catch (erro) {
        console.error(erro);

        res.status(400).json({
            erro: erro.message
        });
    }
};


module.exports = {
    entradaEstoque,
    saidaEstoque
};
