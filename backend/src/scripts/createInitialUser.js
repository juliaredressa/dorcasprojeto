require("dotenv").config();

const bcrypt = require("bcrypt");
const readline = require("node:readline");
const pool = require("../databasePool");

const login = "janaina";
const idFuncionario = 6;

function readPassword() {
    return new Promise((resolve, reject) => {
        const input = process.stdin;
        if (!input.isTTY || typeof input.setRawMode !== "function") {
            reject(new Error("Execute este comando em um terminal interativo."));
            return;
        }

        readline.emitKeypressEvents(input);
        input.setRawMode(true);
        input.resume();
        process.stdout.write("Defina a senha da conta (mínimo 6 caracteres): ");

        let password = "";
        const cleanup = () => {
            input.setRawMode(false);
            input.removeListener("keypress", onKeypress);
            input.pause();
            process.stdout.write("\n");
        };
        const onKeypress = (character, key) => {
            if (key.ctrl && key.name === "c") {
                cleanup();
                reject(new Error("Operação cancelada."));
                return;
            }
            if (key.name === "return" || key.name === "enter") {
                cleanup();
                resolve(password);
                return;
            }
            if (key.name === "backspace") {
                password = password.slice(0, -1);
                return;
            }
            if (!key.ctrl && character) {
                password += character;
            }
        };

        input.on("keypress", onKeypress);
    });
}

async function createInitialUser() {
    const [[{ total }]] = await pool.query(
        "SELECT COUNT(*) AS total FROM usuario"
    );
    if (total > 0) {
        throw new Error("Já existe uma conta em usuario; nenhuma alteração foi feita.");
    }

    const [employees] = await pool.query(
        `SELECT id_pessoa, nome, matricula
         FROM pessoa
         JOIN funcionario USING (id_pessoa)
         WHERE id_pessoa = ?`,
        [idFuncionario]
    );
    if (employees.length === 0) {
        throw new Error(`Não foi encontrado colaborador com ID ${idFuncionario}.`);
    }

    const password = await readPassword();
    if (password.length < 6) {
        throw new Error("A senha precisa ter pelo menos 6 caracteres.");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query(
        "INSERT INTO usuario (id_funcionario, login, senha) VALUES (?, ?, ?)",
        [idFuncionario, login, passwordHash]
    );

    console.log(`Conta "${login}" criada para ${employees[0].nome} (${employees[0].matricula}).`);
    console.log("Agora entre em http://localhost:5173/acesso e use a senha que acabou de definir.");
}

createInitialUser()
    .catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
    })
    .finally(() => pool.end());
