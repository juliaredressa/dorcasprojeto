
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");

require("dotenv").config();
const swaggerDocument = require("./swagger");
const categoriaRoutes = require("./routes/categoriaRoutes");
const gestanteRoutes = require("./routes/gestanteRoutes");
const produtoRoutes = require("./routes/produtoRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/api/categorias", categoriaRoutes);
app.use("/api/gestantes", gestanteRoutes);
app.use("/api/produtos", produtoRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});