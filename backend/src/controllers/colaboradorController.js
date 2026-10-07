const pool = require("../databasePool");

const cargosPermitidos = [
    "Administrador(a)",
    "Assistente social",
    "Auxiliar administrativo(a)",
    "Coordenador(a)",
    "Educador(a) social",
    "Psicólogo(a)",
    "Recepcionista",
    "Outro"
];

// LISTAR
const listarColaboradores = async (req, res) => {

    try {

        const [colaboradores] = await pool.query(`
            SELECT
                f.id_pessoa,
                p.nome,
                p.cpf,
                p.telefone,
                p.email,
                p.endereco,
                f.cargo,
                f.data_admissao
            FROM funcionario f
            INNER JOIN pessoa p
                ON p.id_pessoa = f.id_pessoa
            ORDER BY p.nome
        `);

        res.json(colaboradores);

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            mensagem: "Erro ao listar colaboradores."
        });
    }
};


// BUSCAR POR ID
const buscarColaborador = async (req, res) => {

    try {

        const [colaboradores] = await pool.query(
            `
            SELECT
                f.id_pessoa,
                p.nome,
                p.cpf,
                p.telefone,
                p.email,
                p.endereco,
                f.cargo,
                f.data_admissao
            FROM funcionario f
            INNER JOIN pessoa p
                ON p.id_pessoa = f.id_pessoa
            WHERE f.id_pessoa = ?
            `,
            [req.params.id]
        );

        if (colaboradores.length === 0) {
            return res.status(404).json({
                mensagem: "Colaborador não encontrado."
            });
        }

        res.json(colaboradores[0]);

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            mensagem: "Erro ao buscar colaborador."
        });
    }
};


// CADASTRAR
const cadastrarColaborador = async (req, res) => {

    const {
        nome,
        cpf,
        telefone,
        email,
        endereco,
        cargo,
        data_admissao
    } = req.body;

    if (
        !nome ||
        !cpf ||
        !cargo ||
        !data_admissao
    ) {
        return res.status(400).json({
            mensagem: "Nome, CPF, cargo e data de admissão são obrigatórios."
        });
    }

    if (!cargosPermitidos.includes(cargo.trim())) {
        return res.status(400).json({
            mensagem: "Selecione um cargo válido."
        });
    }

    const conexao = await pool.getConnection();

    try {

        await conexao.beginTransaction();

        const [pessoa] = await conexao.query(
            `
            INSERT INTO pessoa
            (nome, cpf, telefone, email, endereco)
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                nome.trim(),
                cpf.trim(),
                telefone || null,
                email || null,
                endereco || null
            ]
        );

        const idPessoa = pessoa.insertId;
        const matriculaInterna = `COL-${idPessoa}`;

        await conexao.query(
            `
            INSERT INTO funcionario
            (id_pessoa, cargo, matricula, data_admissao)
            VALUES (?, ?, ?, ?)
            `,
            [
                idPessoa,
                cargo.trim(),
                matriculaInterna,
                data_admissao
            ]
        );

        await conexao.commit();

        res.status(201).json({
            id_pessoa: idPessoa,
            mensagem: "Colaborador cadastrado com sucesso."
        });

    } catch (erro) {

        await conexao.rollback();

        console.error(erro);

        if (erro.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                mensagem: "Já existe um colaborador cadastrado com este CPF."
            });
        }

        res.status(500).json({
            mensagem: "Erro ao cadastrar colaborador."
        });

    } finally {

        conexao.release();
    }
};


// ATUALIZAR
const atualizarColaborador = async (req, res) => {

    const {
        nome,
        cpf,
        telefone,
        email,
        endereco,
        cargo,
        data_admissao
    } = req.body;

    if (
        !nome ||
        !cpf ||
        !cargo ||
        !data_admissao
    ) {
        return res.status(400).json({
            mensagem: "Nome, CPF, cargo e data de admissão são obrigatórios."
        });
    }

    if (!cargosPermitidos.includes(cargo.trim())) {
        return res.status(400).json({
            mensagem: "Selecione um cargo válido."
        });
    }

    const conexao = await pool.getConnection();

    try {

        await conexao.beginTransaction();

        const [resultadoFuncionario] = await conexao.query(
            `
            UPDATE funcionario
            SET
                cargo = ?,
                data_admissao = ?
            WHERE id_pessoa = ?
            `,
            [
                cargo.trim(),
                data_admissao,
                req.params.id
            ]
        );

        if (resultadoFuncionario.affectedRows === 0) {

            await conexao.rollback();

            return res.status(404).json({
                mensagem: "Colaborador não encontrado."
            });
        }

        await conexao.query(
            `
            UPDATE pessoa
            SET
                nome = ?,
                cpf = ?,
                telefone = ?,
                email = ?,
                endereco = ?
            WHERE id_pessoa = ?
            `,
            [
                nome.trim(),
                cpf.trim(),
                telefone || null,
                email || null,
                endereco || null,
                req.params.id
            ]
        );

        await conexao.commit();

        res.json({
            mensagem: "Colaborador atualizado com sucesso."
        });

    } catch (erro) {

        await conexao.rollback();

        console.error(erro);

        if (erro.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                mensagem: "Já existe uma pessoa cadastrada com este CPF."
            });
        }

        res.status(500).json({
            mensagem: "Erro ao atualizar colaborador."
        });

    } finally {

        conexao.release();
    }
};


// EXCLUIR
const excluirColaborador = async (req, res) => {

    const conexao = await pool.getConnection();

    try {

        await conexao.beginTransaction();

        const [resultado] = await conexao.query(
            `
            DELETE FROM funcionario
            WHERE id_pessoa = ?
            `,
            [req.params.id]
        );

        if (resultado.affectedRows === 0) {

            await conexao.rollback();

            return res.status(404).json({
                mensagem: "Colaborador não encontrado."
            });
        }

        await conexao.query(
            `
            DELETE FROM pessoa
            WHERE id_pessoa = ?
            `,
            [req.params.id]
        );

        await conexao.commit();

        res.json({
            mensagem: "Colaborador excluído com sucesso."
        });

    } catch (erro) {

        await conexao.rollback();

        console.error(erro);

        if (erro.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(409).json({
                mensagem:
                    "Este colaborador está sendo utilizado em outros registros e não pode ser excluído."
            });
        }

        res.status(500).json({
            mensagem: "Erro ao excluir colaborador."
        });

    } finally {

        conexao.release();
    }
};


module.exports = {
    listarColaboradores,
    buscarColaborador,
    cadastrarColaborador,
    atualizarColaborador,
    excluirColaborador
};