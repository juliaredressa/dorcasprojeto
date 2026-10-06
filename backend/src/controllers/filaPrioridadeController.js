const db = require("../database");


// LISTAR FILA DE PRIORIDADE
const listarFila = (req, res) => {
    const sql = `
        SELECT
            f.id_fila,
            f.posicao_fila,
            f.data_calculo,
            f.id_gestante,
            p.nome AS nome_gestante,
            g.grau_vulnerabilidade
        FROM fila_prioridade f
        INNER JOIN gestante g
            ON f.id_gestante = g.id_pessoa
        INNER JOIN pessoa p
            ON g.id_pessoa = p.id_pessoa
        ORDER BY f.posicao_fila ASC
    `;

    db.query(sql, (erro, resultados) => {
        if (erro) {
            return res.status(500).json({
                erro: "Erro ao listar fila de prioridade."
            });
        }

        res.json(resultados);
    });
};


// BUSCAR GESTANTE NA FILA
const buscarFila = (req, res) => {
    const { id } = req.params;

    const sql = `
        SELECT
            f.id_fila,
            f.posicao_fila,
            f.data_calculo,
            f.id_gestante,
            p.nome AS nome_gestante,
            g.grau_vulnerabilidade
        FROM fila_prioridade f
        INNER JOIN gestante g
            ON f.id_gestante = g.id_pessoa
        INNER JOIN pessoa p
            ON g.id_pessoa = p.id_pessoa
        WHERE f.id_fila = ?
    `;

    db.query(sql, [id], (erro, resultados) => {
        if (erro) {
            return res.status(500).json({
                erro: "Erro ao buscar fila."
            });
        }

        if (resultados.length === 0) {
            return res.status(404).json({
                erro: "Registro não encontrado."
            });
        }

        res.json(resultados[0]);
    });
};


// ADICIONAR GESTANTE NA FILA
const adicionarFila = (req, res) => {
    const {
        posicao_fila,
        data_calculo,
        id_gestante
    } = req.body;


    if (
        !posicao_fila ||
        !data_calculo ||
        !id_gestante
    ) {
        return res.status(400).json({
            erro: "Preencha todos os campos obrigatórios."
        });
    }


    const verificarGestante = `
        SELECT id_pessoa
        FROM gestante
        WHERE id_pessoa = ?
    `;


    db.query(verificarGestante, [id_gestante], (erro, resultado) => {

        if (erro) {
            return res.status(500).json({
                erro: "Erro ao verificar gestante."
            });
        }


        if (resultado.length === 0) {
            return res.status(404).json({
                erro: "Gestante não encontrada."
            });
        }


        const sql = `
            INSERT INTO fila_prioridade
            (
                posicao_fila,
                data_calculo,
                id_gestante
            )
            VALUES (?, ?, ?)
        `;


        db.query(
            sql,
            [
                posicao_fila,
                data_calculo,
                id_gestante
            ],
            (erro) => {

                if (erro) {
                    return res.status(500).json({
                        erro: "Erro ao adicionar na fila."
                    });
                }


                res.status(201).json({
                    mensagem: "Gestante adicionada à fila de prioridade!"
                });
            }
        );
    });
};


// ATUALIZAR POSIÇÃO DA FILA
const atualizarFila = (req, res) => {

    const { id } = req.params;

    const {
        posicao_fila,
        data_calculo
    } = req.body;


    if (!posicao_fila || !data_calculo) {
        return res.status(400).json({
            erro: "Informe posição e data."
        });
    }


    const sql = `
        UPDATE fila_prioridade
        SET
            posicao_fila = ?,
            data_calculo = ?
        WHERE id_fila = ?
    `;


    db.query(
        sql,
        [
            posicao_fila,
            data_calculo,
            id
        ],
        (erro, resultado) => {

            if (erro) {
                return res.status(500).json({
                    erro: "Erro ao atualizar fila."
                });
            }


            if (resultado.affectedRows === 0) {
                return res.status(404).json({
                    erro: "Registro não encontrado."
                });
            }


            res.json({
                mensagem: "Fila atualizada com sucesso!"
            });
        }
    );
};


// REMOVER DA FILA
const excluirFila = (req, res) => {

    const { id } = req.params;


    const sql = `
        DELETE FROM fila_prioridade
        WHERE id_fila = ?
    `;


    db.query(sql, [id], (erro, resultado) => {

        if (erro) {
            return res.status(500).json({
                erro: "Erro ao excluir da fila."
            });
        }


        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                erro: "Registro não encontrado."
            });
        }


        res.json({
            mensagem: "Removido da fila de prioridade!"
        });
    });
};



module.exports = {
    listarFila,
    buscarFila,
    adicionarFila,
    atualizarFila,
    excluirFila
};
