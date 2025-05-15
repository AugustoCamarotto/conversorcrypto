const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
require("dotenv").config();

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret");
            
            // Adiciona o usuário ao objeto req, excluindo a senha
            req.user = await User.findByPk(decoded.id, {
                attributes: { exclude: ["password"] },
            });

            if (!req.user) {
                return res.status(401).json({ message: "Usuário não encontrado, token falhou" });
            }
            next();
        } catch (error) {
            console.error("Erro na autenticação do token:", error);
            res.status(401).json({ message: "Não autorizado, token falhou" });
        }
    }

    if (!token) {
        res.status(401).json({ message: "Não autorizado, sem token" });
    }
};

module.exports = { protect };

