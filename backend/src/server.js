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
const loginRoutes = require("./routes/loginRoutes");
const produtosRoutes = require("./routes/produtoRoutes");
const colaboradoresRoutes = require("./routes/colaboradoresRoutes");
const authRoutes = require("./routes/auth");

const app = express();

const requireAuthentication = (req, res, next) => {
    if (!req.session?.usuario) {
        return res.status(401).json({
            mensagem: "Autenticação necessária para acessar este recurso."
        });
    }
    next();
};

app.use(
    cors({
        origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
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
    requireAuthentication,
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument)
);

// ROTAS
app.use("/gestante", requireAuthentication, gestanteRoutes);
app.use("/produtos", requireAuthentication, produtosRoutes);
app.use("/colaboradores", requireAuthentication, colaboradoresRoutes);
app.use("/auth", authRoutes);
app.use("/api/categorias", requireAuthentication, categoriaRoutes);
app.use("/api/gestantes", requireAuthentication, gestanteRoutes);
app.use("/api/triagens", requireAuthentication, triagemRoutes);
app.use("/api/doacoes", requireAuthentication, doacaoRoutes);
app.use("/api/kits", requireAuthentication, kitRoutes);
app.use("/api/estoque", requireAuthentication, estoqueRoutes);
app.use("/api/fila-prioridade", requireAuthentication, filaPrioridadeRoutes);

app.get("/", (req, res) => {
    res.json({
        mensagem: "API DorcasGestão funcionando!"
    });
});
app.use("/api/produtos", requireAuthentication, produtosRoutes);
app.use("/api/colaboradores", requireAuthentication, colaboradoresRoutes);
app.use("/api/login", loginRoutes);

const PORT = process.env.PORT || 3000;



app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
