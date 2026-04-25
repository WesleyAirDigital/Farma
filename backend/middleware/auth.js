const jwt = require("jsonwebtoken");

const TOKEN_COOKIE_NAME = "farmacia_brasil_admin_token";
const TOKEN_EXPIRATION_SECONDS = 2 * 60 * 60;

function getJwtSecret() {
    return process.env.JWT_SECRET || "";
}

function parseCookies(cookieHeader = "") {
    return cookieHeader
        .split(";")
        .map((part) => part.trim())
        .filter(Boolean)
        .reduce((cookies, part) => {
            const separatorIndex = part.indexOf("=");

            if (separatorIndex <= 0) {
                return cookies;
            }

            const key = part.slice(0, separatorIndex).trim();
            const value = part.slice(separatorIndex + 1).trim();
            cookies[key] = decodeURIComponent(value);
            return cookies;
        }, {});
}

function extractBearerToken(authorizationHeader = "") {
    if (typeof authorizationHeader !== "string") {
        return "";
    }

    const [scheme, token] = authorizationHeader.trim().split(/\s+/);

    if (!/^Bearer$/i.test(scheme || "") || !token) {
        return "";
    }

    return token.trim();
}

function readAuthToken(request) {
    const bearerToken = extractBearerToken(request.headers.authorization);

    if (bearerToken) {
        return bearerToken;
    }

    const cookies = parseCookies(request.headers.cookie);
    return cookies[TOKEN_COOKIE_NAME] || "";
}

function verifyAdminToken(token = "") {
    const secret = getJwtSecret();

    if (!secret) {
        throw new Error("JWT_SECRET não configurado.");
    }

    return jwt.verify(token, secret);
}

function getAuthenticatedAdmin(request) {
    const token = readAuthToken(request);

    if (!token) {
        return null;
    }

    try {
        return verifyAdminToken(token);
    } catch (_error) {
        return null;
    }
}

function requireAdminAuth(request, response, next) {
    const payload = getAuthenticatedAdmin(request);

    if (!payload) {
        response.status(401).json({
            message: "Não autorizado.",
        });
        return;
    }

    request.auth = payload;
    next();
}

function createAdminToken(payload = {}) {
    const secret = getJwtSecret();

    if (!secret) {
        throw new Error("JWT_SECRET não configurado.");
    }

    return jwt.sign(payload, secret, {
        expiresIn: TOKEN_EXPIRATION_SECONDS,
    });
}

function serializeAdminTokenCookie(token = "") {
    const parts = [
        `${TOKEN_COOKIE_NAME}=${encodeURIComponent(token)}`,
        "Path=/",
        "HttpOnly",
        "SameSite=Lax",
        `Max-Age=${TOKEN_EXPIRATION_SECONDS}`,
    ];

    if (process.env.NODE_ENV === "production") {
        parts.push("Secure");
    }

    return parts.join("; ");
}

function serializeClearedAdminTokenCookie() {
    const parts = [
        `${TOKEN_COOKIE_NAME}=`,
        "Path=/",
        "HttpOnly",
        "SameSite=Lax",
        "Max-Age=0",
    ];

    if (process.env.NODE_ENV === "production") {
        parts.push("Secure");
    }

    return parts.join("; ");
}

module.exports = {
    TOKEN_COOKIE_NAME,
    TOKEN_EXPIRATION_SECONDS,
    createAdminToken,
    getAuthenticatedAdmin,
    requireAdminAuth,
    serializeAdminTokenCookie,
    serializeClearedAdminTokenCookie,
};
