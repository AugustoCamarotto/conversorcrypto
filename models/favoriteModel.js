const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./userModel"); // Import User model for association

const FavoriteCoin = sequelize.define("FavoriteCoin", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: "id",
        },
    },
    coin_id: { // ID da moeda da CoinGecko (ex: 'bitcoin')
        type: DataTypes.STRING,
        allowNull: false,
    },
});

// Define a associação: Um usuário pode ter várias moedas favoritas
User.hasMany(FavoriteCoin, { foreignKey: "userId" });
FavoriteCoin.belongsTo(User, { foreignKey: "userId" });

// Garante que um usuário não pode favoritar a mesma moeda múltiplas vezes
FavoriteCoin.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: User,
                key: "id",
            },
        },
        coin_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: "FavoriteCoin",
        indexes: [
            {
                unique: true,
                fields: ["userId", "coin_id"],
            },
        ],
    }
);

module.exports = FavoriteCoin;

