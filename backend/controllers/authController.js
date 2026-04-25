const crypto = require("crypto");

const {
    TOKEN_EXPIRATION_SECONDS,
    createAdminToken,
    serializeAdminTokenCookie,
    serializeClearedAdminTokenCookie,
} = require("../middleware/auth");

function normalizeCredential(value) {
    return typeof value === "string" ? value.trim() : "";
}

function safeEquals(left, right) {
    const leftBuffer = Buffer.from(String(left));
    const rightBuffer = Buffer.from(String(right));

    if (leftBuffer.length !== rightBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function login(request, response) {
    const username = normalizeCredential(request.body.username);
    const password = normalizeCredential(request.body.password);
    const adminUser = normalizeCredential(process.env.ADMIN_USER);
    const adminPassword = normalizeCredential(process.env.ADMIN_PASSWORD);

    if (!adminUser || !adminPassword || !process.env.JWT_SECRET) {
        response.status(500).json({
            message: "Configuração de autenticação incompleta.",
        });
        return;
    }

    if (!safeEquals(username, adminUser) || !safeEquals(password, adminPassword)) {
        response.status(401).json({
            message: "Usuário ou senha inválidos.",
        });
        return;
    }

    const token = createAdminToken({
        sub: adminUser,
        role: "admin",
    });

    response.setHeader("Set-Cookie", serializeAdminTokenCookie(token));
    response.json({
        token,
        expires_in: TOKEN_EXPIRATION_SECONDS,
    });
}

function logout(_request, response) {
    response.setHeader("Set-Cookie", serializeClearedAdminTokenCookie());
    response.json({
        message: "Sessão encerrada.",
    });
}

module.exports = {
    login,
    logout,
};
