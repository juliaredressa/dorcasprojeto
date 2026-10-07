const db = require("../database");

// LISTAR TODAS
const listarGestantes = (req, res) => {
    const sql = `
        SELECT
            g.id_pessoa,
            p.nome,
            p.cpf,
            p.telefone,
            p.endereco,
            g.dpp,
            g.grau_vulnerabilidade,
            g.data_cadastro,
            g.situacao
        FROM gestante g
        INNER JOIN pessoa p
            ON g.id_pessoa = p.id_pessoa
        ORDER BY p.nome
    `;

    db.query(sql, (erro, resultados) => {
        if (erro) {
            return res.status(500).json({
                erro: "Erro ao listar gestantes."
            });
        }

        res.json(resultados);
    });
};


// BUSCAR POR ID
const buscarGestante = (req, res) => {
    const { id } = req.params;

    const sql = `
        SELECT
            g.id_pessoa,
            p.nome,
            p.cpf,
            p.telefone,
            p.endereco,
            g.dpp,
            g.grau_vulnerabilidade,
            g.data_cadastro,
            g.situacao
        FROM gestante g
        INNER JOIN pessoa p
            ON g.id_pessoa = p.id_pessoa
        WHERE g.id_pessoa = ?
    `;

    db.query(sql, [id], (erro, resultados) => {
        if (erro) {
            return res.status(500).json({
                erro: "Erro ao buscar gestante."
            });
        }

        if (resultados.length === 0) {
            return res.status(404).json({
                erro: "Gestante não encontrada."
            });
        }

        res.json(resultados[0]);
    });
};


// CADASTRAR
const cadastrarGestante = async (req, res) => {
    const {
        nome,
        cpf,
        telefone,
        endereco,
        dpp,
        grau_vulnerabilidade,
        data_cadastro,
        situacao
    } = req.body;

    if (
        !nome?.trim() ||
        !cpf?.trim() ||
        !dpp ||
        grau_vulnerabilidade === undefined ||
        !data_cadastro ||
        !situacao
    ) {
        return res.status(400).json({
            erro: "Nome, CPF e todos os dados da gestação são obrigatórios."
        });
    }

    const grauVulnerabilidade = Number(grau_vulnerabilidade);

    if (!Number.isInteger(grauVulnerabilidade) || grauVulnerabilidade < 1 || grauVulnerabilidade > 5) {
        return res.status(400).json({
            erro: "O grau de vulnerabilidade deve estar entre 1 e 5."
        });
    }

    const conexao = db.promise();
    let transacaoIniciada = false;

    try {
        await conexao.beginTransaction();
        transacaoIniciada = true;

        const [pessoa] = await conexao.query(
            `
                INSERT INTO pessoa (nome, cpf, telefone, endereco)
                VALUES (?, ?, ?, ?)
                `,
            [nome.trim(), cpf.trim(), telefone?.trim() || null, endereco?.trim() || null]
        );

        await conexao.query(
            `
                INSERT INTO gestante
                (id_pessoa, dpp, grau_vulnerabilidade, data_cadastro, situacao)
                VALUES (?, ?, ?, ?, ?)
                `,
            [pessoa.insertId, dpp, grauVulnerabilidade, data_cadastro, situacao]
        );

        await conexao.commit();
        transacaoIniciada = false;

        res.status(201).json({
            id_pessoa: pessoa.insertId,
            mensagem: "Gestante cadastrada com sucesso!"
        });
    } catch (erro) {
        if (transacaoIniciada) {
            await conexao.rollback();
        }

        console.error(erro);

        if (erro.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                erro: "Já existe uma pessoa cadastrada com este CPF."
            });
        }

        res.status(500).json({
            erro: "Erro ao cadastrar gestante."
        });
    }
};


// ATUALIZAR
const atualizarGestante = async (req, res) => {
    const { id } = req.params;

    const {
        nome,
        cpf,
        telefone,
        endereco,
        dpp,
        grau_vulnerabilidade,
        data_cadastro,
        situacao
    } = req.body;

    if (
        !nome?.trim() ||
        !cpf?.trim() ||
        !dpp ||
        grau_vulnerabilidade === undefined ||
        !data_cadastro ||
        !situacao
    ) {
        return res.status(400).json({
            erro: "Nome, CPF e todos os dados da gestação são obrigatórios."
        });
    }

    const grauVulnerabilidade = Number(grau_vulnerabilidade);

    if (!Number.isInteger(grauVulnerabilidade) || grauVulnerabilidade < 1 || grauVulnerabilidade > 5) {
        return res.status(400).json({
            erro: "O grau de vulnerabilidade deve estar entre 1 e 5."
        });
    }

    const conexao = db.promise();
    let transacaoIniciada = false;

    try {
        await conexao.beginTransaction();
        transacaoIniciada = true;

        const [gestantes] = await conexao.query(
            "SELECT id_pessoa FROM gestante WHERE id_pessoa = ? FOR UPDATE",
            [id]
        );

        if (gestantes.length === 0) {
            await conexao.rollback();
            transacaoIniciada = false;
            return res.status(404).json({ erro: "Gestante não encontrada." });
        }

        await conexao.query(
            `
                UPDATE pessoa
                SET nome = ?, cpf = ?, telefone = ?, endereco = ?
                WHERE id_pessoa = ?
                `,
            [nome.trim(), cpf.trim(), telefone?.trim() || null, endereco?.trim() || null, id]
        );

        await conexao.query(
            `
                UPDATE gestante
                SET dpp = ?, grau_vulnerabilidade = ?, data_cadastro = ?, situacao = ?
                WHERE id_pessoa = ?
                `,
            [dpp, grauVulnerabilidade, data_cadastro, situacao, id]
        );

        await conexao.commit();
        transacaoIniciada = false;

        res.json({ mensagem: "Gestante atualizada com sucesso!" });
    } catch (erro) {
        if (transacaoIniciada) {
            await conexao.rollback();
        }

        console.error(erro);

        if (erro.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                erro: "Já existe uma pessoa cadastrada com este CPF."
            });
        }

        res.status(500).json({ erro: "Erro ao atualizar gestante." });
    }
};


// EXCLUIR
const excluirGestante = (req, res) => {
    const { id } = req.params;

    const sql = `
        DELETE FROM gestante
        WHERE id_pessoa = ?
    `;

    db.query(sql, [id], (erro, resultado) => {
        if (erro) {
            return res.status(500).json({
                erro: "Erro ao excluir gestante."
            });
        }

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                erro: "Gestante não encontrada."
            });
        }

        res.json({
            mensagem: "Gestante excluída com sucesso!"
        });
    });
};


module.exports = {
    listarGestantes,
    buscarGestante,
    cadastrarGestante,
    atualizarGestante,
    excluirGestante
};
