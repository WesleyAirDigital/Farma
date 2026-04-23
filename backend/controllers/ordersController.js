const orderModel = require("../models/orderModel");

const ALLOWED_STATUSES = [
    "novo",
    "separando",
    "saiu para entrega",
    "concluído",
];

function createHttpError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

function normalizeOptionalText(value) {
    if (typeof value !== "string") {
        return value == null ? null : String(value).trim() || null;
    }

    return value.trim() || null;
}

function normalizeSubtotal(value) {
    if (value === "" || value == null) {
        return null;
    }

    const subtotal = Number(value);
    return Number.isFinite(subtotal) ? Number(subtotal.toFixed(2)) : null;
}

function normalizeItems(items) {
    if (!Array.isArray(items) || !items.length) {
        throw createHttpError("O pedido precisa ter pelo menos um item.");
    }

    return items.map((item) => {
        const quantity = Math.max(1, Number(item.quantity || item.quantidade) || 1);
        const unitPriceRaw = item.unit_price ?? item.preco ?? null;
        const lineTotalRaw = item.line_total ?? item.total ?? null;
        const unitPrice = unitPriceRaw == null || unitPriceRaw === ""
            ? null
            : Number(unitPriceRaw);
        const lineTotal = lineTotalRaw == null || lineTotalRaw === ""
            ? (Number.isFinite(unitPrice) ? Number((unitPrice * quantity).toFixed(2)) : null)
            : Number(lineTotalRaw);

        return {
            name: normalizeOptionalText(item.name || item.nome),
            quantity,
            unit_price: Number.isFinite(unitPrice) ? Number(unitPrice.toFixed(2)) : null,
            line_total: Number.isFinite(lineTotal) ? Number(lineTotal.toFixed(2)) : null,
        };
    }).filter((item) => item.name);
}

function buildOrderPayload(body = {}) {
    const address = body.address || {};
    const customerName = normalizeOptionalText(body.customer_name);
    const phone = normalizeOptionalText(body.phone);
    const paymentMethod = normalizeOptionalText(body.payment_method);
    const items = normalizeItems(body.items);

    if (!customerName) {
        throw createHttpError("Informe o nome do cliente.");
    }

    if (!phone) {
        throw createHttpError("Informe o telefone do cliente.");
    }

    if (!paymentMethod) {
        throw createHttpError("Informe a forma de pagamento.");
    }

    if (!normalizeOptionalText(address.street)) {
        throw createHttpError("Informe a rua do endereço.");
    }

    return {
        customerName,
        phone,
        items,
        subtotal: normalizeSubtotal(body.subtotal),
        paymentMethod,
        changeAmount: normalizeOptionalText(body.change_amount),
        addressStreet: normalizeOptionalText(address.street),
        addressNumber: normalizeOptionalText(address.number),
        addressDistrict: normalizeOptionalText(address.district),
        addressZip: normalizeOptionalText(address.zip),
        addressReference: normalizeOptionalText(address.reference),
        addressBlock: normalizeOptionalText(address.block),
        addressApartment: normalizeOptionalText(address.apartment),
        notes: normalizeOptionalText(body.notes),
        status: "novo",
    };
}

async function createOrder(request, response, next) {
    try {
        const payload = buildOrderPayload(request.body);
        const order = await orderModel.createOrder(payload);

        response.status(201).json({
            message: "Pedido salvo com sucesso.",
            order,
        });
    } catch (error) {
        next(error);
    }
}

async function listOrders(_request, response, next) {
    try {
        const orders = await orderModel.listOrders();

        response.json({
            orders,
        });
    } catch (error) {
        next(error);
    }
}

async function updateOrderStatus(request, response, next) {
    try {
        const orderId = Number(request.params.id);
        const nextStatus = normalizeOptionalText(request.body.status);

        if (!Number.isInteger(orderId) || orderId <= 0) {
            throw createHttpError("Pedido inválido.", 400);
        }

        if (!nextStatus || !ALLOWED_STATUSES.includes(nextStatus)) {
            throw createHttpError("Status inválido.", 400);
        }

        const order = await orderModel.updateOrderStatus(orderId, nextStatus);

        if (!order) {
            throw createHttpError("Pedido não encontrado.", 404);
        }

        response.json({
            message: "Status atualizado com sucesso.",
            order,
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createOrder,
    listOrders,
    updateOrderStatus,
    ALLOWED_STATUSES,
};
