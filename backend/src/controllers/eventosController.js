const pool = require("../databasePool");

const sexosPermitidos = new Set([
    "FEMININO",
    "MASCULINO",
    "AINDA_NAO_SEI",
    "NAO_INFORMADO"
]);

async function listar(req, res) {
    try {
        const [eventos] = await pool.query(`
            SELECT
                e.id_evento,
                e.nome_evento,
                e.descricao,
                e.data_evento,
                e.horario,
                e.local_evento,
                (SELECT COUNT(*) FROM palestra p WHERE p.id_evento = e.id_evento) AS total_palestras,
                (SELECT COUNT(*) FROM evento_participante ep WHERE ep.id_evento = e.id_evento) AS total_inscritas,
                (SELECT COUNT(*) FROM doacao d WHERE d.id_evento = e.id_evento) AS total_doacoes,
                (SELECT COUNT(*) FROM kit_maternidade k WHERE k.id_evento = e.id_evento) AS total_kits
            FROM evento e
            ORDER BY e.data_evento DESC, e.id_evento DESC
        `);
        return res.json(eventos);
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ mensagem: "Não foi possível listar os eventos." });
    }
}

async function buscar(req, res) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ mensagem: "Identificador de evento inválido." });
    }

    try {
        const [eventos] = await pool.query(
            `SELECT id_evento, nome_evento, descricao, data_evento, horario, local_evento
             FROM evento WHERE id_evento = ?`,
            [id]
        );
        if (eventos.length === 0) {
            return res.status(404).json({ mensagem: "Evento não encontrado." });
        }

        const [palestras] = await pool.query(
            `SELECT p.id_palestra, p.titulo, p.descricao, p.horario,
                    p.id_psicologo, pes.nome AS nome_psicologo
             FROM palestra p
             INNER JOIN funcionario f ON f.id_pessoa = p.id_psicologo
             INNER JOIN pessoa pes ON pes.id_pessoa = f.id_pessoa
             WHERE p.id_evento = ?
             ORDER BY p.horario, p.id_palestra`,
            [id]
        );
        const [participantes] = await pool.query(
            `SELECT ep.id_gestante, pes.nome AS nome_gestante, g.sexo_bebe,
                    ep.presente, ep.id_kit, k.status AS status_kit
             FROM evento_participante ep
             INNER JOIN gestante g ON g.id_pessoa = ep.id_gestante
             INNER JOIN pessoa pes ON pes.id_pessoa = g.id_pessoa
             LEFT JOIN kit_maternidade k ON k.id_kit = ep.id_kit
             WHERE ep.id_evento = ?
             ORDER BY pes.nome`,
            [id]
        );
        const [doacoes] = await pool.query(
            `SELECT d.id_doacao, d.data_doacao, pes.nome AS nome_funcionario,
                    (SELECT COUNT(*) FROM item_doacao_recebida r WHERE r.id_doacao = d.id_doacao) AS total_itens
             FROM doacao d
             INNER JOIN funcionario f ON f.id_pessoa = d.id_funcionario
             INNER JOIN pessoa pes ON pes.id_pessoa = f.id_pessoa
             WHERE d.id_evento = ?
             ORDER BY d.data_doacao DESC, d.id_doacao DESC`,
            [id]
        );
        const [kits] = await pool.query(
            `SELECT k.id_kit, k.id_gestante, pes.nome AS nome_gestante, k.status,
                    k.data_montagem, k.data_entrega
             FROM kit_maternidade k
             INNER JOIN gestante g ON g.id_pessoa = k.id_gestante
             INNER JOIN pessoa pes ON pes.id_pessoa = g.id_pessoa
             WHERE k.id_evento = ?
             ORDER BY k.id_kit DESC`,
            [id]
        );

        return res.json({ ...eventos[0], palestras, participantes, doacoes, kits });
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ mensagem: "Não foi possível carregar o evento." });
    }
}

async function listarPsicologos(req, res) {
    try {
        const [psicologos] = await pool.query(
            `SELECT f.id_pessoa, p.nome
             FROM funcionario f
             INNER JOIN pessoa p ON p.id_pessoa = f.id_pessoa
             WHERE LOWER(f.cargo) IN ('psicólogo(a)', 'psicologo(a)')
             ORDER BY p.nome`
        );
        return res.json(psicologos);
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ mensagem: "Não foi possível listar os psicólogos." });
    }
}

async function listarGestantes(req, res) {
    try {
        const [gestantes] = await pool.query(
            `SELECT g.id_pessoa, p.nome, g.sexo_bebe
             FROM gestante g
             INNER JOIN pessoa p ON p.id_pessoa = g.id_pessoa
             WHERE g.situacao = 'ATIVA'
             ORDER BY p.nome`
        );
        return res.json(gestantes);
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ mensagem: "Não foi possível listar as gestantes." });
    }
}

async function listarKits(req, res) {
    const idEvento = Number(req.query.id_evento);
    if (!Number.isInteger(idEvento) || idEvento < 1) {
        return res.status(400).json({ mensagem: "Informe um evento válido." });
    }

    try {
        const [kits] = await pool.query(
            `SELECT k.id_kit, k.id_gestante, k.status, p.nome AS nome_gestante
             FROM kit_maternidade k
             INNER JOIN gestante g ON g.id_pessoa = k.id_gestante
             INNER JOIN pessoa p ON p.id_pessoa = g.id_pessoa
             WHERE k.id_evento IS NULL OR k.id_evento = ?
             ORDER BY p.nome, k.id_kit DESC`,
            [idEvento]
        );
        return res.json(kits);
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ mensagem: "Não foi possível listar os kits." });
    }
}

async function criar(req, res) {
    const { nome_evento, descricao, data_evento, horario, local_evento } = req.body;
    if (typeof nome_evento !== "string" || !nome_evento.trim() || !data_evento) {
        return res.status(400).json({ mensagem: "Nome e data do evento são obrigatórios." });
    }
    if (nome_evento.trim().length > 150) {
        return res.status(400).json({ mensagem: "O nome do evento deve ter até 150 caracteres." });
    }

    try {
        const [resultado] = await pool.query(
            `INSERT INTO evento (nome_evento, descricao, data_evento, horario, local_evento)
             VALUES (?, ?, ?, ?, ?)`,
            [nome_evento.trim(), descricao?.trim() || null, data_evento, horario || null, local_evento?.trim() || null]
        );
        return res.status(201).json({ id_evento: resultado.insertId, mensagem: "Evento cadastrado com sucesso." });
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ mensagem: "Não foi possível cadastrar o evento." });
    }
}

async function atualizar(req, res) {
    const id = Number(req.params.id);
    const { nome_evento, descricao, data_evento, horario, local_evento } = req.body;
    if (!Number.isInteger(id) || id < 1 || typeof nome_evento !== "string" || !nome_evento.trim() || !data_evento) {
        return res.status(400).json({ mensagem: "Informe nome e data válidos para o evento." });
    }

    try {
        const [resultado] = await pool.query(
            `UPDATE evento SET nome_evento = ?, descricao = ?, data_evento = ?, horario = ?, local_evento = ?
             WHERE id_evento = ?`,
            [nome_evento.trim(), descricao?.trim() || null, data_evento, horario || null, local_evento?.trim() || null, id]
        );
        if (resultado.affectedRows === 0) {
            const [eventos] = await pool.query("SELECT id_evento FROM evento WHERE id_evento = ?", [id]);
            if (eventos.length === 0) {
                return res.status(404).json({ mensagem: "Evento não encontrado." });
            }
        }
        return res.json({ mensagem: "Evento atualizado com sucesso." });
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ mensagem: "Não foi possível atualizar o evento." });
    }
}

async function excluir(req, res) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ mensagem: "Identificador de evento inválido." });
    }
    try {
        const [resultado] = await pool.query("DELETE FROM evento WHERE id_evento = ?", [id]);
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ mensagem: "Evento não encontrado." });
        }
        return res.json({ mensagem: "Evento excluído. Doações e kits foram preservados." });
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ mensagem: "Não foi possível excluir o evento." });
    }
}

async function adicionarPalestra(req, res) {
    const idEvento = Number(req.params.id);
    const { titulo, descricao, horario, id_psicologo } = req.body;
    const idPsicologo = Number(id_psicologo);
    if (!Number.isInteger(idEvento) || idEvento < 1 || !titulo?.trim() ||
        !Number.isInteger(idPsicologo) || idPsicologo < 1) {
        return res.status(400).json({ mensagem: "Informe tema e psicólogo para a palestra." });
    }
    try {
        const [eventos] = await pool.query("SELECT id_evento FROM evento WHERE id_evento = ?", [idEvento]);
        if (!eventos.length) return res.status(404).json({ mensagem: "Evento não encontrado." });

        const [psicologos] = await pool.query(
            `SELECT id_pessoa FROM funcionario
             WHERE id_pessoa = ? AND LOWER(cargo) IN ('psicólogo(a)', 'psicologo(a)')`,
            [idPsicologo]
        );
        if (!psicologos.length) return res.status(400).json({ mensagem: "Selecione um colaborador com cargo de psicólogo." });

        const [resultado] = await pool.query(
            `INSERT INTO palestra (id_evento, titulo, descricao, horario, id_psicologo)
             VALUES (?, ?, ?, ?, ?)`,
            [idEvento, titulo.trim(), descricao?.trim() || null, horario || null, idPsicologo]
        );
        return res.status(201).json({ id_palestra: resultado.insertId, mensagem: "Palestra adicionada ao evento." });
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ mensagem: "Não foi possível adicionar a palestra." });
    }
}

async function excluirPalestra(req, res) {
    const idEvento = Number(req.params.id);
    const idPalestra = Number(req.params.idPalestra);
    if (!Number.isInteger(idEvento) || idEvento < 1 || !Number.isInteger(idPalestra) || idPalestra < 1) {
        return res.status(400).json({ mensagem: "Identificador de palestra inválido." });
    }
    try {
        const [resultado] = await pool.query(
            "DELETE FROM palestra WHERE id_palestra = ? AND id_evento = ?",
            [idPalestra, idEvento]
        );
        if (!resultado.affectedRows) return res.status(404).json({ mensagem: "Palestra não encontrada neste evento." });
        return res.json({ mensagem: "Palestra removida do evento." });
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ mensagem: "Não foi possível excluir a palestra." });
    }
}

async function registrarParticipante(req, res) {
    const idEvento = Number(req.params.id);
    const idGestante = Number(req.params.idGestante);
    const presente = req.body.presente === false || req.body.presente === 0 ? 0 : 1;
    const idKit = req.body.id_kit ? Number(req.body.id_kit) : null;

    if (!Number.isInteger(idEvento) || idEvento < 1 || !Number.isInteger(idGestante) || idGestante < 1 ||
        (idKit !== null && (!Number.isInteger(idKit) || idKit < 1)) || (idKit !== null && !presente)) {
        return res.status(400).json({ mensagem: "Dados de participação ou entrega do kit inválidos." });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [eventos] = await connection.query("SELECT id_evento FROM evento WHERE id_evento = ? FOR UPDATE", [idEvento]);
        if (!eventos.length) {
            await connection.rollback();
            return res.status(404).json({ mensagem: "Evento não encontrado." });
        }
        const [gestantes] = await connection.query(
            "SELECT id_pessoa FROM gestante WHERE id_pessoa = ?",
            [idGestante]
        );
        if (!gestantes.length) {
            await connection.rollback();
            return res.status(404).json({ mensagem: "Gestante não encontrada." });
        }

        if (idKit !== null) {
            const [kits] = await connection.query(
                "SELECT id_kit, id_gestante, id_evento FROM kit_maternidade WHERE id_kit = ? FOR UPDATE",
                [idKit]
            );
            if (!kits.length || Number(kits[0].id_gestante) !== idGestante ||
                (kits[0].id_evento !== null && Number(kits[0].id_evento) !== idEvento)) {
                await connection.rollback();
                return res.status(400).json({ mensagem: "O kit precisa pertencer à gestante e não pode estar associado a outro evento." });
            }
            await connection.query(
                `UPDATE kit_maternidade
                 SET id_evento = ?, status = 'Entregue', data_entrega = COALESCE(data_entrega, CURDATE())
                 WHERE id_kit = ?`,
                [idEvento, idKit]
            );
        }

        const [participacoesExistentes] = await connection.query(
            `SELECT id_kit FROM evento_participante
             WHERE id_evento = ? AND id_gestante = ? FOR UPDATE`,
            [idEvento, idGestante]
        );
        if (!presente && participacoesExistentes[0]?.id_kit) {
            await connection.rollback();
            return res.status(409).json({
                mensagem: "A participante tem um kit registrado como entregue e não pode ser marcada como ausente."
            });
        }

        await connection.query(
            `INSERT INTO evento_participante (id_evento, id_gestante, presente, id_kit)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                presente = VALUES(presente),
                id_kit = COALESCE(VALUES(id_kit), id_kit)`,
            [idEvento, idGestante, presente, idKit]
        );
        await connection.commit();
        return res.json({ mensagem: "Participação da gestante registrada." });
    } catch (erro) {
        if (connection) await connection.rollback().catch((rollbackError) => console.error(rollbackError));
        if (erro.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ mensagem: "Este kit já foi vinculado a outra participante." });
        }
        console.error(erro);
        return res.status(500).json({ mensagem: "Não foi possível registrar a participação." });
    } finally {
        if (connection) connection.release();
    }
}

module.exports = {
    listar,
    buscar,
    listarPsicologos,
    listarGestantes,
    listarKits,
    criar,
    atualizar,
    excluir,
    adicionarPalestra,
    excluirPalestra,
    registrarParticipante
};
