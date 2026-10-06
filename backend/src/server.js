const express = require("express");
const cors = require("cors");
const session = require("express-session");
const swaggerUi = require("swagger-ui-express");

require("dotenv").config();

const swaggerDocument = require("./swagger");

const categoriaRoutes = require("./routes/categoriaRoutes");
const gestanteRoutes = require("./routes/gestanteRoutes");
const triagemRoutes = require("./routes/triagemRoutes");
const doacaoRoutes = require("./routes/doacaoRoutes");
const kitRoutes = require("./routes/kitRoutes");
const estoqueRoutes = require("./routes/estoqueRoutes");
const filaPrioridadeRoutes = require("./routes/filaPrioridadeRoutes");
const produtoRoutes = require("./routes/produtoRoutes");
const colaboradorRoutes = require("./routes/colaboradorRoutes");
const loginRoutes = require("./routes/loginRoutes");

const app = express();

app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true
    })
);

app.use(express.json());

app.use(
    session({
        secret: process.env.SESSION_SECRET || "dorcas-secret",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: false,
            maxAge: 1000 * 60 * 60 * 8
        }
    })
);

app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument)
);

// ROTAS
app.use("/api/categorias", categoriaRoutes);
app.use("/api/gestantes", gestanteRoutes);
app.use("/api/triagens", triagemRoutes);
app.use("/api/doacoes", doacaoRoutes);
app.use("/api/kits", kitRoutes);
app.use("/api/estoque", estoqueRoutes);
app.use("/api/fila-prioridade", filaPrioridadeRoutes);

app.get("/", (req, res) => {
    res.json({
        mensagem: "API DorcasGestão funcionando!"
    });
});
app.use("/api/produtos", produtoRoutes);
app.use("/api/colaboradores", colaboradorRoutes);
app.use("/api/login", loginRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
