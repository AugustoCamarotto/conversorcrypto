require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sequelize = require("./config/db");
const path = require("path"); // Adicionado para servir arquivos estáticos

const authRoutes = require("./routes/authRoutes");
const cryptoRoutes = require("./routes/cryptoRoutes"); // Descomentado e adicionado

// Importar modelos para sincronização
const User = require("./models/userModel");
const ConversionHistory = require("./models/historyModel"); // Será criado a seguir
const FavoriteCoin = require("./models/favoriteModel"); // Será criado a seguir

const app = express();

// Middlewares
app.use(cors()); // Habilitar CORS para todas as origens
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas da API
app.use("/api/auth", authRoutes);
app.use("/api/crypto", cryptoRoutes); // Rota para funcionalidades de cripto

// Servir arquivos estáticos do frontend (ajustar o caminho se necessário)
// O frontend original está em /home/ubuntu/crypto_simulator/src/static
// Para este projeto Node.js, vamos assumir que o frontend será copiado para uma pasta 'public' ou similar
// Por enquanto, vamos deixar comentado e focar no backend.
// app.use(express.static(path.join(__dirname, "public"))); 
// app.get("/*", (req, res) => {
//     res.sendFile(path.join(__dirname, "public", "index.html"));
// });

const PORT = process.env.NODE_PORT || 3000;

sequelize.authenticate()
    .then(() => {
        console.log("Conexão com o banco de dados estabelecida com sucesso.");
        // Sincronizar modelos com o banco de dados
        // É importante que todos os modelos sejam importados antes de chamar sequelize.sync()
        return sequelize.sync({ force: false }); // force: false para não apagar dados existentes
    })
    .then(() => {
        console.log("Modelos sincronizados com o banco de dados.");
        app.listen(PORT, () => {
            console.log(`Servidor Node.js rodando na porta ${PORT}`);
        });
    })
    .catch(err => {
        console.error("Erro ao conectar ou sincronizar com o banco de dados:", err);
    });

