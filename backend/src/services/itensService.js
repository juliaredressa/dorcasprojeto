// Agrupa linhas do mesmo produto e ordena as atualizações para reduzir deadlocks.
function normalizarItens(itens) {
    if (!Array.isArray(itens) || itens.length === 0) {
        throw new Error('Informe pelo menos um item.');
    }
    const agrupados = new Map();
    for (const item of itens) {
        const id = Number(item?.id_item);
        const quantidade = Number(item?.quantidade);
        if (!Number.isSafeInteger(id) || id < 1 || !Number.isSafeInteger(quantidade) || quantidade < 1) {
            throw new Error('Todos os itens devem possuir id e quantidade inteiros maiores que zero.');
        }
        const total = (agrupados.get(id) || 0) + quantidade;
        if (!Number.isSafeInteger(total) || total > 2147483647) {
            throw new Error('Quantidade de itens acima do limite permitido.');
        }
        agrupados.set(id, total);
    }
    return [...agrupados].sort(([a], [b]) => a - b)
        .map(([id_item, quantidade]) => ({ id_item, quantidade }));
}

module.exports = { normalizarItens };
