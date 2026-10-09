require("dotenv").config();

const bcrypt = require("bcrypt");
const readline = require("node:readline");
const pool = require("../databasePool");

function readHidden(prompt) {
    return new Promise((resolve, reject) => {
        const input = process.stdin;
        if (!input.isTTY || typeof input.setRawMode !== "function") {
            reject(new Error("Execute este comando em um terminal interativo."));
            return;
        }

        readline.emitKeypressEvents(input);
        input.setRawMode(true);
        input.resume();
        process.stdout.write(prompt);

        let value = "";
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
                resolve(value);
                return;
            }
            if (key.name === "backspace") {
                value = value.slice(0, -1);
                return;
            }
            if (!key.ctrl && character) value += character;
        };

        input.on("keypress", onKeypress);
    });
}

async function resetUserPassword() {
    if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
        throw new Error("Execute este comando em um terminal interativo.");
    }

    const terminal = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    let login;
    try {
        login = (await terminal.question("Login da conta para redefinir: ")).trim();
    } finally {
        terminal.close();
    }

    if (!login) throw new Error("Informe o login da conta.");

    const [users] = await pool.query(
        "SELECT id_usuario FROM usuario WHERE login = ?",
        [login]
    );
    if (users.length === 0) throw new Error("Não foi encontrada uma conta com esse login.");

    const newPassword = await readHidden("Nova senha (mínimo 6 caracteres): ");
    if (newPassword.length < 6) {
        throw new Error("A senha precisa ter pelo menos 6 caracteres.");
    }

    const confirmation = await readHidden("Confirme a nova senha: ");
    if (newPassword !== confirmation) {
        throw new Error("As senhas não conferem. Nenhuma alteração foi feita.");
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const [result] = await pool.query(
        "UPDATE usuario SET senha = ? WHERE id_usuario = ?",
        [passwordHash, users[0].id_usuario]
    );
    if (result.affectedRows !== 1) {
        throw new Error("Não foi possível redefinir a senha da conta.");
    }

    console.log(`Senha redefinida para a conta "${login}".`);
}

resetUserPassword()
    .catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
    })
    .finally(() => pool.end());
