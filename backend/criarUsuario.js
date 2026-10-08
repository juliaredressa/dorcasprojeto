const bcrypt = require('bcrypt');
const db = require('./db');

async function criarUsuario() {

    const senhaHash = await bcrypt.hash('123456', 10);

    const sqlPessoa = `
        INSERT INTO pessoa
        (nome, cpf, email)
        VALUES (?, ?, ?)
    `;

    db.query(
        sqlPessoa,
        [
            'Administrador',
            '00000000000',
            'admin@dorcas.com'
        ],
        (err, result) => {

            if (err) {
                console.error(err);
                return;
            }

            const idPessoa = result.insertId;

            const sqlUsuario = `
                INSERT INTO usuario
                (id_pessoa, email, senha)
                VALUES (?, ?, ?)
            `;

            db.query(
                sqlUsuario,
                [
                    idPessoa,
                    'admin@dorcas.com',
                    senhaHash
                ],
                err => {

                    if (err) {
                        console.error(err);
                        return;
                    }

                    console.log(
                        'Usuário criado com sucesso!'
                    );

                    process.exit();
                }
            );
        }
    );
}

criarUsuario();