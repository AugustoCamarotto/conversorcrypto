const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./userModel"); // Import User model for association

const ConversionHistory = sequelize.define("ConversionHistory", {
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
    amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    brl_value: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    usd_value: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    brl_rate: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    usd_rate: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
    },
});

// Define a associação: Um usuário pode ter vários históricos de conversão
User.hasMany(ConversionHistory, { foreignKey: "userId" });
ConversionHistory.belongsTo(User, { foreignKey: "userId" });

module.exports = ConversionHistory;

