const mysql = require("mysql2");

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

connection.connect((erro) => {
    if (erro) {
        console.error("Erro ao conectar ao banco:", erro);
        return;
    }

    console.log("Banco de dados conectado!");
});

module.exports = connection;