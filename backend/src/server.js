
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const gestanteRoutes = require("./routes/gestanteRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/gestantes", gestanteRoutes);

app.get("/", (req, res) => {
    res.json({
        mensagem: "API DorcasGestão funcionando!"
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});