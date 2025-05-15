const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || "your_jwt_secret", {
        expiresIn: "1d", // Token expira em 1 dia
    });
};

exports.registerUser = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Nome de usuário e senha são obrigatórios" });
    }

    try {
        const userExists = await User.findOne({ where: { username } });
        if (userExists) {
            return res.status(409).json({ message: "Nome de usuário já existe" });
        }

        const newUser = await User.create({ username, password });

        if (newUser) {
            res.status(201).json({
                message: "Usuário registrado com sucesso",
                token: generateToken(newUser.id),
                username: newUser.username,
            });
        } else {
            res.status(400).json({ message: "Dados de usuário inválidos" });
        }
    } catch (error) {
        console.error("Erro no registro:", error);
        res.status(500).json({ message: "Erro interno do servidor ao registrar usuário", error: error.message });
    }
};

exports.loginUser = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Nome de usuário e senha são obrigatórios" });
    }

    try {
        const user = await User.findOne({ where: { username } });

        if (user && (await user.isValidPassword(password))) {
            res.json({
                message: "Login bem-sucedido",
                token: generateToken(user.id),
                username: user.username,
            });
        } else {
            res.status(401).json({ message: "Nome de usuário ou senha inválidos" });
        }
    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ message: "Erro interno do servidor ao fazer login", error: error.message });
    }
};

// Rota para verificar o status do login (opcional, mas útil para o frontend)
exports.getLoginStatus = async (req, res) => {
    // O middleware authMiddleware já terá verificado o token e adicionado req.user
    if (req.user) {
        res.json({ logged_in: true, username: req.user.username, id: req.user.id });
    } else {
        // Isso não deveria acontecer se o middleware estiver protegendo a rota corretamente
        res.status(401).json({ logged_in: false, message: "Não autenticado" });
    }
};

