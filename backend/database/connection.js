require("dotenv").config();

const mysql = require("mysql2/promise");

const pool = mysql.createPool({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "farmacia_brasil",
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
    queueLimit: 0,
    charset: "utf8mb4",
});

async function testDatabaseConnection() {
    const connection = await pool.getConnection();

    try {
        await connection.ping();
        console.log("[database] Conexão com MySQL estabelecida.");
    } finally {
        connection.release();
    }
}

module.exports = {
    pool,
    testDatabaseConnection,
};
