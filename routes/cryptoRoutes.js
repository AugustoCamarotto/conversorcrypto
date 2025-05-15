const express = require("express");
const {
    getCoinsList,
    convertCurrency,
    getConversionHistory,
    addFavorite,      // Adicionado
    removeFavorite,   // Adicionado
    getFavorites      // Adicionado
} = require("../controllers/cryptoController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

// Rotas de Informação e Conversão de Criptomoedas
router.get("/coins_list", protect, getCoinsList);
router.post("/convert", protect, convertCurrency);
router.get("/history", protect, getConversionHistory);

// Rotas de Favoritos
// @route   POST /api/crypto/favorites
// @desc    Add a coin to favorites
// @access  Private
router.post("/favorites", protect, addFavorite);

// @route   DELETE /api/crypto/favorites/:coin_id
// @desc    Remove a coin from favorites
// @access  Private
router.delete("/favorites/:coin_id", protect, removeFavorite);

// @route   GET /api/crypto/favorites
// @desc    Get user's favorite coins
// @access  Private
router.get("/favorites", protect, getFavorites);

module.exports = router;

