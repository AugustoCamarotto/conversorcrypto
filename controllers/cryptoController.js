const axios = require("axios");
const ConversionHistory = require("../models/historyModel");
const FavoriteCoin = require("../models/favoriteModel"); // Importar o modelo FavoriteCoin
require("dotenv").config();

const COINGECKO_API_URL = "https://api.coingecko.com/api/v3";

exports.getCoinsList = async (req, res) => {
    try {
        const response = await axios.get(`${COINGECKO_API_URL}/coins/list`);
        res.json(response.data);
    } catch (error) {
        console.error("Erro ao buscar lista de moedas da CoinGecko:", error.response ? error.response.data : error.message);
        res.status(error.response ? error.response.status : 500).json({
            message: "Erro ao buscar lista de moedas",
            error: error.response ? error.response.data : error.message,
        });
    }
};

exports.convertCurrency = async (req, res) => {
    const { coin_id, amount } = req.body;
    const userId = req.user.id;

    if (!coin_id || amount === undefined) {
        return res.status(400).json({ message: "ID da criptomoeda e quantidade são obrigatórios" });
    }

    let numericAmount;
    try {
        numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({ message: "A quantidade deve ser um número positivo" });
        }
    } catch (error) {
        return res.status(400).json({ message: "A quantidade deve ser um número válido" });
    }

    try {
        const params = {
            ids: coin_id,
            vs_currencies: "brl,usd",
        };
        const response = await axios.get(`${COINGECKO_API_URL}/simple/price`, { params });
        const conversion_rates = response.data;

        if (!conversion_rates[coin_id] || !conversion_rates[coin_id].brl || !conversion_rates[coin_id].usd) {
            return res.status(404).json({ message: `Não foi possível obter as taxas de conversão para ${coin_id}` });
        }

        const brl_price = conversion_rates[coin_id].brl;
        const usd_price = conversion_rates[coin_id].usd;

        const converted_brl = numericAmount * brl_price;
        const converted_usd = numericAmount * usd_price;

        await ConversionHistory.create({
            userId,
            coin_id,
            amount: numericAmount,
            brl_value: converted_brl,
            usd_value: converted_usd,
            brl_rate: brl_price,
            usd_rate: usd_price,
        });
        
        res.json({
            coin_id: coin_id,
            amount: numericAmount,
            brl_value: converted_brl,
            usd_value: converted_usd,
            brl_rate: brl_price,
            usd_rate: usd_price,
            message: "Conversão realizada e salva no histórico com sucesso."
        });

    } catch (error) {
        console.error("Erro ao converter moeda ou salvar histórico:", error.response ? error.response.data : error.message);
        let statusCode = 500;
        let errMessage = "Erro interno do servidor";
        if (error.isAxiosError) {
            statusCode = error.response ? error.response.status : 503;
            errMessage = "Erro ao comunicar com a API CoinGecko para conversão";
        } else {
            errMessage = "Erro ao salvar a conversão no histórico";
        }
        res.status(statusCode).json({
            message: errMessage,
            error: error.response ? error.response.data : error.message,
        });
    }
};

exports.getConversionHistory = async (req, res) => {
    const userId = req.user.id;
    try {
        const historyRecords = await ConversionHistory.findAll({
            where: { userId },
            order: [["timestamp", "DESC"]],
        });
        res.json(historyRecords);
    } catch (error) {
        console.error("Erro ao buscar histórico de conversões:", error.message);
        res.status(500).json({
            message: "Erro ao buscar histórico de conversões",
            error: error.message,
        });
    }
};

// Favoritos
exports.addFavorite = async (req, res) => {
    const { coin_id } = req.body;
    const userId = req.user.id;

    if (!coin_id) {
        return res.status(400).json({ message: "ID da criptomoeda é obrigatório" });
    }

    try {
        const existingFavorite = await FavoriteCoin.findOne({ where: { userId, coin_id } });
        if (existingFavorite) {
            return res.status(409).json({ message: "Criptomoeda já está nos favoritos" });
        }

        const newFavorite = await FavoriteCoin.create({ userId, coin_id });
        res.status(201).json({ message: `${coin_id} adicionada aos favoritos`, favorite: newFavorite });
    } catch (error) {
        console.error("Erro ao adicionar favorito:", error.message);
        res.status(500).json({ message: "Erro ao adicionar favorito", error: error.message });
    }
};

exports.removeFavorite = async (req, res) => {
    const { coin_id } = req.params; // Pegar coin_id da URL
    const userId = req.user.id;

    try {
        const favoriteToDelete = await FavoriteCoin.findOne({ where: { userId, coin_id } });
        if (!favoriteToDelete) {
            return res.status(404).json({ message: "Criptomoeda não encontrada nos favoritos" });
        }

        await favoriteToDelete.destroy();
        res.json({ message: `${coin_id} removida dos favoritos` });
    } catch (error) {
        console.error("Erro ao remover favorito:", error.message);
        res.status(500).json({ message: "Erro ao remover favorito", error: error.message });
    }
};

exports.getFavorites = async (req, res) => {
    const userId = req.user.id;
    try {
        const favorites = await FavoriteCoin.findAll({ where: { userId } });
        res.json(favorites.map(fav => ({ id: fav.id, coin_id: fav.coin_id, userId: fav.userId }))); // Retornar apenas os campos necessários
    } catch (error) {
        console.error("Erro ao buscar favoritos:", error.message);
        res.status(500).json({ message: "Erro ao buscar favoritos", error: error.message });
    }
};

