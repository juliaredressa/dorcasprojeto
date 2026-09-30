const express = require("express");
const cors = require("cors");
require("dotenv").config();

const gestanteRoutes = require("./routes/gestanteRoutes");
const triagemRoutes = require("./routes/triagemRoutes");
const doacaoRoutes = require("./routes/doacaoRoutes");
const kitRoutes = require("./routes/kitRoutes");
const estoqueRoutes = require("./routes/estoqueRoutes");
const filaPrioridadeRoutes = require("./routes/filaPrioridadeRoutes");

const app = express();

app.use(cors());
app.use(express.json());

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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
