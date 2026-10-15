const pool = require('../databasePool');
const { adicionarAoEstoque } = require('../services/estoqueService');

const consultaProdutos = `
    SELECT i.*, c.nome_categoria,
           COALESCE(e.quantidade_atual, 0) AS quantidade_atual,
           e.local_armazenamento
    FROM item_doacao i
    INNER JOIN categoria_item c ON c.id_categoria = i.id_categoria
    LEFT JOIN estoque e ON e.id_item = i.id_item`;

function validarProduto(dados, cadastro) {
    if (typeof dados.nome_item !== 'string' || !dados.nome_item.trim() ||
        typeof dados.unidade_medida !== 'string' || !dados.unidade_medida.trim() ||
        !Number.isSafeInteger(Number(dados.id_categoria)) || Number(dados.id_categoria) < 1) {
        return 'Preencha o nome, a unidade de medida e a categoria do produto.';
    }
    if (!Number.isSafeInteger(Number(dados.quantidade_minima)) || Number(dados.quantidade_minima) < 1) {
        return 'A quantidade mínima deve ser um número inteiro maior que zero.';
    }
    if (cadastro && dados.quantidade_atual !== undefined &&
        (dados.quantidade_atual === '' || !Number.isSafeInteger(Number(dados.quantidade_atual)) || Number(dados.quantidade_atual) < 0)) {
        return 'A quantidade em estoque deve ser um número inteiro igual ou maior que zero.';
    }
    return null;
}

exports.listar = async (req, res) => {
    try {
        const [produtos] = await pool.query(`${consultaProdutos} ORDER BY i.nome_item`);
        res.json(produtos);
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao listar produtos.' });
    }
};

exports.buscar = async (req, res) => {
    try {
        const [produtos] = await pool.query(`${consultaProdutos} WHERE i.id_item = ?`, [req.params.id]);
        if (!produtos.length) return res.status(404).json({ erro: 'Produto não encontrado.' });
        res.json(produtos[0]);
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao buscar produto.' });
    }
};

exports.categorias = async (req, res) => {
    try {
        const [categorias] = await pool.query('SELECT * FROM categoria_item ORDER BY nome_categoria');
        res.json(categorias);
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao listar categorias.' });
    }
};

async function salvarProduto(req, res, cadastro) {
    const erroValidacao = validarProduto(req.body, cadastro);
    if (erroValidacao) return res.status(400).json({ erro: erroValidacao });
    const { nome_item, tamanho, unidade_medida, quantidade_minima, id_categoria, local_armazenamento } = req.body;
    let conexao;
    try {
        conexao = await pool.getConnection();
        await conexao.beginTransaction();
        let id = req.params.id;
        if (!cadastro) {
            const [produtos] = await conexao.query('SELECT id_item FROM item_doacao WHERE id_item = ? FOR UPDATE', [id]);
            if (!produtos.length) {
                await conexao.rollback();
                return res.status(404).json({ erro: 'Produto não encontrado.' });
            }
        }
        const [categorias] = await conexao.query('SELECT id_categoria FROM categoria_item WHERE id_categoria = ?', [id_categoria]);
        if (!categorias.length) {
            await conexao.rollback();
            return res.status(400).json({ erro: 'Categoria inválida.' });
        }
        const valores = [nome_item.trim(), tamanho || null, unidade_medida.trim(), Number(quantidade_minima), Number(id_categoria)];
        if (cadastro) {
            const [resultado] = await conexao.query(
                'INSERT INTO item_doacao (nome_item, tamanho, unidade_medida, quantidade_minima, id_categoria) VALUES (?, ?, ?, ?, ?)', valores);
            id = resultado.insertId;
            await conexao.query('INSERT INTO estoque (id_item, quantidade_atual, local_armazenamento) VALUES (?, 0, ?)', [id, local_armazenamento || '']);
            const quantidade = Number(req.body.quantidade_atual || 0);
            if (quantidade > 0) await adicionarAoEstoque(conexao, id, quantidade);
        } else {
            await conexao.query(
                'UPDATE item_doacao SET nome_item = ?, tamanho = ?, unidade_medida = ?, quantidade_minima = ?, id_categoria = ? WHERE id_item = ?', [...valores, id]);
            // Edição de cadastro nunca substitui o saldo. Ajustes usam a tela Estoque.
            if (local_armazenamento !== undefined) {
                await conexao.query(`INSERT INTO estoque (id_item, quantidade_atual, local_armazenamento)
                    VALUES (?, 0, ?) ON DUPLICATE KEY UPDATE local_armazenamento = VALUES(local_armazenamento)`, [id, local_armazenamento || '']);
            }
        }
        await conexao.commit();
        res.status(cadastro ? 201 : 200).json({
            mensagem: cadastro ? 'Produto cadastrado com sucesso.' : 'Produto atualizado com sucesso.',
            id_item: Number(id)
        });
    } catch (erro) {
        if (conexao) await conexao.rollback();
        res.status(400).json({ erro: 'Não foi possível salvar o produto.', detalhe: erro.message });
    } finally {
        conexao?.release();
    }
}

exports.cadastrar = (req, res) => salvarProduto(req, res, true);
exports.editar = (req, res) => salvarProduto(req, res, false);

exports.excluir = async (req, res) => {
    let conexao;
    try {
        conexao = await pool.getConnection();
        await conexao.beginTransaction();
        const [produtos] = await conexao.query('SELECT id_item FROM item_doacao WHERE id_item = ? FOR UPDATE', [req.params.id]);
        if (!produtos.length) {
            await conexao.rollback();
            return res.status(404).json({ erro: 'Produto não encontrado.' });
        }
        await conexao.query('DELETE FROM estoque WHERE id_item = ?', [req.params.id]);
        await conexao.query('DELETE FROM item_doacao WHERE id_item = ?', [req.params.id]);
        await conexao.commit();
        res.json({ mensagem: 'Produto excluído com sucesso.' });
    } catch (erro) {
        if (conexao) await conexao.rollback();
        res.status(erro.code === 'ER_ROW_IS_REFERENCED_2' ? 409 : 400).json({
            erro: erro.code === 'ER_ROW_IS_REFERENCED_2'
                ? 'Este produto possui registros vinculados e não pode ser excluído.'
                : 'Não foi possível excluir o produto.'
        });
    } finally {
        conexao?.release();
    }
};
