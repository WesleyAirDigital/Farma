const ORDER_STATUSES = [
    "novo",
    "separando",
    "saiu para entrega",
    "concluído",
];

const ordersList = document.getElementById("ordersList");
const adminFeedback = document.getElementById("adminFeedback");
const refreshOrdersButton = document.getElementById("refreshOrdersButton");
const totalOrdersCount = document.getElementById("totalOrdersCount");
const newOrdersCount = document.getElementById("newOrdersCount");
const activeOrdersCount = document.getElementById("activeOrdersCount");

function getApiBaseUrl() {
    if (window.FARMACIA_BRASIL_API_BASE_URL) {
        return window.FARMACIA_BRASIL_API_BASE_URL.replace(/\/$/, "");
    }

    if (window.location.protocol === "file:") {
        return "http://localhost:3000";
    }

    return "";
}

const API_BASE_URL = getApiBaseUrl();

function buildApiUrl(path = "") {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${API_BASE_URL}${normalizedPath}`;
}

function formatCurrency(value) {
    if (value == null || Number.isNaN(Number(value))) {
        return "Sob consulta";
    }

    return Number(value).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}

function formatDate(value) {
    if (!value) {
        return "Data indisponível";
    }

    return new Date(value).toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
    });
}

function setFeedback(message = "", state = "") {
    adminFeedback.textContent = message;
    adminFeedback.className = "admin-feedback";

    if (state) {
        adminFeedback.classList.add(`is-${state}`);
    }
}

function updateStats(orders = []) {
    const total = orders.length;
    const newOrders = orders.filter((order) => order.status === "novo").length;
    const activeOrders = orders.filter((order) => ["separando", "saiu para entrega"].includes(order.status)).length;

    totalOrdersCount.textContent = String(total);
    newOrdersCount.textContent = String(newOrders);
    activeOrdersCount.textContent = String(activeOrders);
}

function formatAddress(address = {}) {
    const parts = [
        address.street,
        address.number ? `nº ${address.number}` : "",
        address.district,
        address.zip ? `CEP ${address.zip}` : "",
        address.reference ? `Ref.: ${address.reference}` : "",
        address.block ? `Bloco ${address.block}` : "",
        address.apartment ? `Ap. ${address.apartment}` : "",
    ].filter(Boolean);

    return parts.length ? parts.join(" • ") : "Endereço não informado";
}

function renderOrder(order) {
    const itemsMarkup = (order.items || []).map((item) => {
        const unitPrice = item.unit_price == null ? "valor sob consulta" : formatCurrency(item.unit_price);
        return `<li><strong>${item.name}</strong> x ${item.quantity} <span>(${unitPrice})</span></li>`;
    }).join("");

    const buttonsMarkup = ORDER_STATUSES.map((status) => `
        <button
            class="status-button${order.status === status ? " is-active" : ""}"
            type="button"
            data-order-id="${order.id}"
            data-status="${status}">
            ${status}
        </button>
    `).join("");

    return `
        <article class="order-card" data-order-id="${order.id}">
            <div class="order-card__header">
                <div>
                    <span class="eyebrow">Pedido #${order.id}</span>
                    <h2>${order.customerName}</h2>
                    <p>${order.phone}</p>
                </div>
                <span class="order-card__badge">${order.status}</span>
            </div>

            <div class="order-card__meta">
                <p><strong>Recebido:</strong> ${formatDate(order.createdAt)}</p>
                <p><strong>Subtotal:</strong> ${formatCurrency(order.subtotal)}</p>
                <p><strong>Pagamento:</strong> ${order.paymentMethod || "Não informado"}</p>
            </div>

            <div class="order-card__sections">
                <section class="order-card__section">
                    <h3>Itens</h3>
                    <ul>${itemsMarkup || "<li>Nenhum item informado.</li>"}</ul>
                </section>

                <section class="order-card__section">
                    <h3>Endereço</h3>
                    <p>${formatAddress(order.address)}</p>
                    <p>${order.changeAmount ? `<strong>Troco:</strong> ${order.changeAmount}` : ""}</p>
                </section>

                <section class="order-card__section">
                    <h3>Observações</h3>
                    <p>${order.notes || "Sem observações adicionais."}</p>
                </section>
            </div>

            <div class="status-actions">
                ${buttonsMarkup}
            </div>
        </article>
    `;
}

function renderOrders(orders = []) {
    updateStats(orders);

    if (!orders.length) {
        ordersList.innerHTML = `
            <article class="empty-state">
                <strong>Nenhum pedido salvo ainda.</strong>
                <p>Assim que um cliente finalizar um pedido, ele aparecerá aqui.</p>
            </article>
        `;
        return;
    }

    ordersList.innerHTML = orders.map(renderOrder).join("");
}

async function fetchOrders() {
    const response = await fetch(buildApiUrl("/orders"));

    if (!response.ok) {
        throw new Error("Não foi possível carregar os pedidos.");
    }

    const data = await response.json();
    return Array.isArray(data.orders) ? data.orders : [];
}

async function updateOrderStatus(orderId, status) {
    const response = await fetch(buildApiUrl(`/orders/${orderId}/status`), {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
    });

    if (!response.ok) {
        throw new Error("Não foi possível atualizar o status do pedido.");
    }

    const data = await response.json();
    return data.order;
}

async function loadOrders() {
    try {
        setFeedback("Atualizando pedidos...");
        const orders = await fetchOrders();
        renderOrders(orders);
        setFeedback("Pedidos carregados com sucesso.", "success");
    } catch (error) {
        renderOrders([]);
        setFeedback(error.message, "error");
    }
}

if (refreshOrdersButton) {
    refreshOrdersButton.addEventListener("click", loadOrders);
}

if (ordersList) {
    ordersList.addEventListener("click", async (event) => {
        const button = event.target.closest("[data-order-id][data-status]");

        if (!button) {
            return;
        }

        const { orderId, status } = button.dataset;

        try {
            setFeedback("Atualizando status do pedido...");
            await updateOrderStatus(orderId, status);
            await loadOrders();
            setFeedback("Status atualizado com sucesso.", "success");
        } catch (error) {
            setFeedback(error.message, "error");
        }
    });
}

loadOrders();
