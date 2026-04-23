const { pool } = require("../database/connection");

function parseItems(items) {
    if (!items) {
        return [];
    }

    if (Array.isArray(items)) {
        return items;
    }

    try {
        return JSON.parse(items);
    } catch (_error) {
        return [];
    }
}

function mapOrderRow(row) {
    return {
        id: row.id,
        customerName: row.customer_name,
        phone: row.phone,
        items: parseItems(row.items),
        subtotal: row.subtotal == null ? null : Number(row.subtotal),
        paymentMethod: row.payment_method,
        changeAmount: row.change_amount,
        address: {
            street: row.address_street,
            number: row.address_number,
            district: row.address_district,
            zip: row.address_zip,
            reference: row.address_reference,
            block: row.address_block,
            apartment: row.address_apartment,
        },
        notes: row.notes,
        status: row.status,
        createdAt: row.created_at,
    };
}

async function findOrderById(orderId) {
    const [rows] = await pool.execute(
        `SELECT
            id,
            customer_name,
            phone,
            items,
            subtotal,
            payment_method,
            change_amount,
            address_street,
            address_number,
            address_district,
            address_zip,
            address_reference,
            address_block,
            address_apartment,
            notes,
            status,
            created_at
        FROM orders
        WHERE id = ?`,
        [orderId]
    );

    return rows[0] ? mapOrderRow(rows[0]) : null;
}

async function createOrder(orderData) {
    const [result] = await pool.execute(
        `INSERT INTO orders (
            customer_name,
            phone,
            items,
            subtotal,
            payment_method,
            change_amount,
            address_street,
            address_number,
            address_district,
            address_zip,
            address_reference,
            address_block,
            address_apartment,
            notes,
            status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            orderData.customerName,
            orderData.phone,
            JSON.stringify(orderData.items || []),
            orderData.subtotal,
            orderData.paymentMethod,
            orderData.changeAmount,
            orderData.addressStreet,
            orderData.addressNumber,
            orderData.addressDistrict,
            orderData.addressZip,
            orderData.addressReference,
            orderData.addressBlock,
            orderData.addressApartment,
            orderData.notes,
            orderData.status || "novo",
        ]
    );

    return findOrderById(result.insertId);
}

async function listOrders() {
    const [rows] = await pool.query(
        `SELECT
            id,
            customer_name,
            phone,
            items,
            subtotal,
            payment_method,
            change_amount,
            address_street,
            address_number,
            address_district,
            address_zip,
            address_reference,
            address_block,
            address_apartment,
            notes,
            status,
            created_at
        FROM orders
        ORDER BY created_at DESC`
    );

    return rows.map(mapOrderRow);
}

async function updateOrderStatus(orderId, status) {
    const [result] = await pool.execute(
        "UPDATE orders SET status = ? WHERE id = ?",
        [status, orderId]
    );

    if (!result.affectedRows) {
        return null;
    }

    return findOrderById(orderId);
}

module.exports = {
    createOrder,
    listOrders,
    updateOrderStatus,
    findOrderById,
};
