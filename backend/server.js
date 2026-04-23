require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");

const orderRoutes = require("./routes/orders");
const { testDatabaseConnection } = require("./database/connection");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const projectRoot = path.resolve(__dirname, "..");
const adminDirectory = path.join(projectRoot, "admin");
const imagesDirectory = path.join(projectRoot, "images");
const frontendIndexFile = path.join(projectRoot, "index.html");

function resolveCorsOrigins() {
    const configuredOrigins = (process.env.CORS_ORIGIN || "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);

    if (!configuredOrigins.length || configuredOrigins.includes("*")) {
        return true;
    }

    return (origin, callback) => {
        if (!origin || configuredOrigins.includes(origin)) {
            callback(null, true);
            return;
        }

        callback(new Error("Origem não autorizada pelo CORS."));
    };
}

app.use(cors({
    origin: resolveCorsOrigins(),
}));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

app.get("/health", (_request, response) => {
    response.json({
        ok: true,
        service: "farmacia-brasil-api",
    });
});

app.use("/orders", orderRoutes);

app.use("/admin", express.static(adminDirectory));
app.use("/images", express.static(imagesDirectory));

app.get("/", (_request, response) => {
    response.sendFile(frontendIndexFile);
});

app.get("/index.html", (_request, response) => {
    response.sendFile(frontendIndexFile);
});

app.use((request, response) => {
    if (request.accepts("html")) {
        response.status(404).send("Página não encontrada.");
        return;
    }

    response.status(404).json({
        message: "Rota não encontrada.",
    });
});

app.use((error, _request, response, _next) => {
    console.error("[api]", error);

    response.status(error.statusCode || 500).json({
        message: error.message || "Erro interno do servidor.",
    });
});

async function startServer() {
    await testDatabaseConnection();

    app.listen(PORT, () => {
        console.log(`[server] API rodando em http://localhost:${PORT}`);
    });
}

startServer().catch((error) => {
    console.error("[server] Falha ao iniciar a API.", error);
    process.exit(1);
});
