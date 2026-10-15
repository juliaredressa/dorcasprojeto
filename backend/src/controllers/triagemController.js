const db = require("../database");

// LISTAR TODAS AS TRIAGENS
const listarTriagens = (req, res) => {
    const sql = `
        SELECT
            t.id_triagem,
            t.data_triagem,
            t.nota_vulnerabilidade,
            t.observacoes,
            t.id_gestante,
            p.nome AS nome_gestante,
                g.dpp,
                g.sexo_bebe,
                t.id_funcionario
        FROM triagem_social t
        INNER JOIN gestante g
            ON t.id_gestante = g.id_pessoa
        INNER JOIN pessoa p
            ON g.id_pessoa = p.id_pessoa
        ORDER BY t.data_triagem DESC
    `;

    db.query(sql, (erro, resultados) => {
        if (erro) {
            return res.status(500).json({
                erro: "Erro ao listar triagens."
            });
        }

        res.json(resultados);
    });
};


// BUSCAR TRIAGEM POR ID
const buscarTriagem = (req, res) => {
    const { id } = req.params;

    const sql = `
        SELECT
            t.id_triagem,
            t.data_triagem,
            t.nota_vulnerabilidade,
            t.observacoes,
            t.id_gestante,
            p.nome AS nome_gestante,
                g.dpp,
                g.sexo_bebe,
                t.id_funcionario
        FROM triagem_social t
        INNER JOIN gestante g
            ON t.id_gestante = g.id_pessoa
        INNER JOIN pessoa p
            ON g.id_pessoa = p.id_pessoa
        WHERE t.id_triagem = ?
    `;

    db.query(sql, [id], (erro, resultados) => {
        if (erro) {
            return res.status(500).json({
                erro: "Erro ao buscar triagem."
            });
        }

        if (resultados.length === 0) {
            return res.status(404).json({
                erro: "Triagem não encontrada."
            });
        }

        res.json(resultados[0]);
    });
};


// CADASTRAR TRIAGEM
const cadastrarTriagem = async (req, res) => {
    const {
        data_triagem,
        nota_vulnerabilidade,
        observacoes,
        id_gestante,
        id_funcionario
    } = req.body;

    if (
        !data_triagem ||
        nota_vulnerabilidade === undefined ||
        !id_gestante ||
        !id_funcionario
    ) {
        return res.status(400).json({
            erro: "Preencha todos os campos obrigatórios."
        });
    }

    const notaVulnerabilidade = Number(nota_vulnerabilidade);
    if (!Number.isInteger(notaVulnerabilidade) || notaVulnerabilidade < 1 || notaVulnerabilidade > 5) {
        return res.status(400).json({
            erro: "A nota de vulnerabilidade deve estar entre 1 e 5."
        });
    }

    let conexao;
    try {
        conexao = await db.promise().getConnection();
        await conexao.beginTransaction();

        const [gestantes] = await conexao.query(
            "SELECT id_pessoa FROM gestante WHERE id_pessoa = ? FOR UPDATE",
            [id_gestante]
        );
        if (gestantes.length === 0) {
            await conexao.rollback();
            return res.status(404).json({ erro: "Gestante não encontrada." });
        }

        const [funcionarios] = await conexao.query(
            "SELECT id_pessoa FROM funcionario WHERE id_pessoa = ?",
            [id_funcionario]
        );
        if (funcionarios.length === 0) {
            await conexao.rollback();
            return res.status(404).json({ erro: "Funcionário não encontrado." });
        }

        const [resultado] = await conexao.query(
            `INSERT INTO triagem_social
                (data_triagem, nota_vulnerabilidade, observacoes, id_gestante, id_funcionario)
             VALUES (?, ?, ?, ?, ?)`,
            [data_triagem, notaVulnerabilidade, observacoes || null, id_gestante, id_funcionario]
        );

        await conexao.query(
            "UPDATE gestante SET grau_vulnerabilidade = ? WHERE id_pessoa = ?",
            [notaVulnerabilidade, id_gestante]
        );
        await conexao.commit();

        return res.status(201).json({
            mensagem: "Triagem cadastrada e vulnerabilidade da gestante atualizada com sucesso!",
            id_triagem: resultado.insertId
        });
    } catch (erro) {
        if (conexao) {
            await conexao.rollback();
        }
        console.error(erro);
        return res.status(500).json({ erro: "Erro ao cadastrar triagem." });
    } finally {
        conexao?.release();
    }
};


// ATUALIZAR TRIAGEM
const atualizarTriagem = async (req, res) => {
    const { id } = req.params;

    const {
        data_triagem,
        nota_vulnerabilidade,
        observacoes,
        id_gestante,
        id_funcionario
    } = req.body;

    if (
        !data_triagem ||
        nota_vulnerabilidade === undefined ||
        !id_gestante ||
        !id_funcionario
    ) {
        return res.status(400).json({
            erro: "Preencha todos os campos obrigatórios."
        });
    }

    const notaVulnerabilidade = Number(nota_vulnerabilidade);
    if (!Number.isInteger(notaVulnerabilidade) || notaVulnerabilidade < 1 || notaVulnerabilidade > 5) {
        return res.status(400).json({
            erro: "A nota de vulnerabilidade deve estar entre 1 e 5."
        });
    }

    let conexao;
    try {
        conexao = await db.promise().getConnection();
        await conexao.beginTransaction();

        const [triagens] = await conexao.query(
            "SELECT id_triagem FROM triagem_social WHERE id_triagem = ? FOR UPDATE",
            [id]
        );
        if (triagens.length === 0) {
            await conexao.rollback();
            return res.status(404).json({ erro: "Triagem não encontrada." });
        }

        const [gestantes] = await conexao.query(
            "SELECT id_pessoa FROM gestante WHERE id_pessoa = ? FOR UPDATE",
            [id_gestante]
        );
        if (gestantes.length === 0) {
            await conexao.rollback();
            return res.status(404).json({ erro: "Gestante não encontrada." });
        }

        const [funcionarios] = await conexao.query(
            "SELECT id_pessoa FROM funcionario WHERE id_pessoa = ?",
            [id_funcionario]
        );
        if (funcionarios.length === 0) {
            await conexao.rollback();
            return res.status(404).json({ erro: "Funcionário não encontrado." });
        }

        await conexao.query(
            `UPDATE triagem_social
             SET data_triagem = ?, nota_vulnerabilidade = ?, observacoes = ?, id_gestante = ?, id_funcionario = ?
             WHERE id_triagem = ?`,
            [data_triagem, notaVulnerabilidade, observacoes || null, id_gestante, id_funcionario, id]
        );
        await conexao.query(
            "UPDATE gestante SET grau_vulnerabilidade = ? WHERE id_pessoa = ?",
            [notaVulnerabilidade, id_gestante]
        );
        await conexao.commit();

        return res.json({ mensagem: "Triagem e vulnerabilidade da gestante atualizadas com sucesso!" });
    } catch (erro) {
        if (conexao) {
            await conexao.rollback();
        }
        console.error(erro);
        return res.status(500).json({ erro: "Erro ao atualizar triagem." });
    } finally {
        conexao?.release();
    }
};


// EXCLUIR TRIAGEM
const excluirTriagem = (req, res) => {
    const { id } = req.params;

    const sql = `
        DELETE FROM triagem_social
        WHERE id_triagem = ?
    `;

    db.query(sql, [id], (erro, resultado) => {
        if (erro) {
            return res.status(500).json({
                erro: "Erro ao excluir triagem."
            });
        }

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                erro: "Triagem não encontrada."
            });
        }

        res.json({
            mensagem: "Triagem excluída com sucesso!"
        });
    });
};


module.exports = {
    listarTriagens,
    buscarTriagem,
    cadastrarTriagem,
    atualizarTriagem,
    excluirTriagem
};
