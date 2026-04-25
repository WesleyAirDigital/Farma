const ORDER_STATUSES = [
    "novo",
    "separando",
    "saiu para entrega",
    "concluído",
];

const ADMIN_TOKEN_STORAGE_KEY = "farmaciaBrasilAdminToken";

const ordersList = document.getElementById("ordersList");
const adminFeedback = document.getElementById("adminFeedback");
const refreshOrdersButton = document.getElementById("refreshOrdersButton");
const totalOrdersCount = document.getElementById("totalOrdersCount");
const newOrdersCount = document.getElementById("newOrdersCount");
const activeOrdersCount = document.getElementById("activeOrdersCount");

const adminLoginForm = document.getElementById("adminLoginForm");
const adminUsernameInput = document.getElementById("adminUsername");
const adminPasswordInput = document.getElementById("adminPassword");
const adminLoginFeedback = document.getElementById("adminLoginFeedback");
const adminLoginSubmit = document.getElementById("adminLoginSubmit");

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

function getAdminPanelUrl() {
    return buildApiUrl("/admin");
}

function getAdminLoginUrl() {
    return buildApiUrl("/admin/login");
}

function getStoredAdminToken() {
    return window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY)?.trim() || "";
}

function storeAdminToken(token = "") {
    if (!token) {
        return;
    }

    window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
}

function clearAdminToken() {
    window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
}

function buildAuthHeaders(headersInit = {}) {
    const headers = new Headers(headersInit);
    const token = getStoredAdminToken();

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
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
    if (!adminFeedback) {
        return;
    }

    adminFeedback.textContent = message;
    adminFeedback.className = "admin-feedback";

    if (state) {
        adminFeedback.classList.add(`is-${state}`);
    }
}

function setLoginFeedback(message = "", state = "") {
    if (!adminLoginFeedback) {
        return;
    }

    adminLoginFeedback.textContent = message;
    adminLoginFeedback.className = "admin-feedback";

    if (state) {
        adminLoginFeedback.classList.add(`is-${state}`);
    }
}

function updateStats(orders = []) {
    if (!totalOrdersCount || !newOrdersCount || !activeOrdersCount) {
        return;
    }

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

function createElement(tagName, className = "", textContent = "") {
    const element = document.createElement(tagName);

    if (className) {
        element.className = className;
    }

    if (textContent) {
        element.textContent = textContent;
    }

    return element;
}

function createLabeledParagraph(label, value) {
    const paragraph = document.createElement("p");
    const strong = document.createElement("strong");
    strong.textContent = `${label}:`;
    paragraph.append(strong, document.createTextNode(` ${value}`));
    return paragraph;
}

function renderEmptyState(title, description) {
    if (!ordersList) {
        return;
    }

    const article = createElement("article", "empty-state");
    const strong = createElement("strong", "", title);
    const paragraph = createElement("p", "", description);
    article.append(strong, paragraph);
    ordersList.replaceChildren(article);
}

function createOrderItemsList(items = []) {
    const list = document.createElement("ul");

    if (!items.length) {
        const listItem = createElement("li", "", "Nenhum item informado.");
        list.append(listItem);
        return list;
    }

    items.forEach((item) => {
        const listItem = document.createElement("li");
        const name = createElement("strong", "", item.name || "Item");
        const unitPriceLabel = item.unit_price == null ? "valor sob consulta" : formatCurrency(item.unit_price);
        const suffix = createElement("span", "", ` (${unitPriceLabel})`);
        listItem.append(name, document.createTextNode(` x ${item.quantity || 1}`), suffix);
        list.append(listItem);
    });

    return list;
}

function createStatusButtons(order = {}) {
    const container = createElement("div", "status-actions");

    ORDER_STATUSES.forEach((status) => {
        const button = createElement(
            "button",
            `status-button${order.status === status ? " is-active" : ""}`,
            status
        );
        button.type = "button";
        button.dataset.orderId = String(order.id);
        button.dataset.status = status;
        container.append(button);
    });

    return container;
}

function renderOrder(order = {}) {
    const article = createElement("article", "order-card");
    article.dataset.orderId = String(order.id || "");

    const header = createElement("div", "order-card__header");
    const headerContent = document.createElement("div");
    const eyebrow = createElement("span", "eyebrow", `Pedido #${order.id}`);
    const title = createElement("h2", "", order.customerName || "Cliente não informado");
    const phone = createElement("p", "", order.phone || "Telefone não informado");
    headerContent.append(eyebrow, title, phone);

    const badge = createElement("span", "order-card__badge", order.status || "novo");
    header.append(headerContent, badge);

    const meta = createElement("div", "order-card__meta");
    meta.append(
        createLabeledParagraph("Recebido", formatDate(order.createdAt)),
        createLabeledParagraph("Subtotal", formatCurrency(order.subtotal)),
        createLabeledParagraph("Pagamento", order.paymentMethod || "Não informado")
    );

    const sections = createElement("div", "order-card__sections");

    const itemsSection = createElement("section", "order-card__section");
    itemsSection.append(createElement("h3", "", "Itens"), createOrderItemsList(order.items || []));

    const addressSection = createElement("section", "order-card__section");
    addressSection.append(createElement("h3", "", "Endereço"));
    addressSection.append(createElement("p", "", formatAddress(order.address || {})));
    if (order.changeAmount) {
        addressSection.append(createLabeledParagraph("Troco", order.changeAmount));
    }

    const notesSection = createElement("section", "order-card__section");
    notesSection.append(createElement("h3", "", "Observações"));
    notesSection.append(createElement("p", "", order.notes || "Sem observações adicionais."));

    sections.append(itemsSection, addressSection, notesSection);
    article.append(header, meta, sections, createStatusButtons(order));
    return article;
}

function renderOrders(orders = []) {
    updateStats(orders);

    if (!ordersList) {
        return;
    }

    if (!orders.length) {
        renderEmptyState(
            "Nenhum pedido salvo ainda.",
            "Assim que um cliente finalizar um pedido, ele aparecerá aqui."
        );
        return;
    }

    ordersList.replaceChildren(...orders.map(renderOrder));
}

async function extractResponseError(response, fallbackMessage) {
    try {
        const data = await response.json();
        return data.message || fallbackMessage;
    } catch (_error) {
        return fallbackMessage;
    }
}

function handleUnauthorizedAccess() {
    clearAdminToken();
    window.location.href = getAdminLoginUrl();
}

async function fetchOrders() {
    const response = await fetch(buildApiUrl("/orders"), {
        headers: buildAuthHeaders(),
        credentials: "same-origin",
    });

    if (response.status === 401) {
        handleUnauthorizedAccess();
        throw new Error("Sessão expirada. Faça login novamente.");
    }

    if (!response.ok) {
        throw new Error(await extractResponseError(response, "Não foi possível carregar os pedidos."));
    }

    const data = await response.json();
    return Array.isArray(data.orders) ? data.orders : [];
}

async function updateOrderStatus(orderId, status) {
    const response = await fetch(buildApiUrl(`/orders/${orderId}/status`), {
        method: "PATCH",
        headers: buildAuthHeaders({
            "Content-Type": "application/json",
        }),
        credentials: "same-origin",
        body: JSON.stringify({ status }),
    });

    if (response.status === 401) {
        handleUnauthorizedAccess();
        throw new Error("Sessão expirada. Faça login novamente.");
    }

    if (!response.ok) {
        throw new Error(await extractResponseError(response, "Não foi possível atualizar o status do pedido."));
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

async function loginAdmin(username, password) {
    const response = await fetch(buildApiUrl("/auth/login"), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
        throw new Error(await extractResponseError(response, "Não foi possível autenticar."));
    }

    const data = await response.json();

    if (!data.token) {
        throw new Error("Token JWT não retornado pela API.");
    }

    storeAdminToken(data.token);
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

if (adminLoginForm && adminUsernameInput && adminPasswordInput) {
    adminLoginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        setLoginFeedback("");

        const username = adminUsernameInput.value.trim();
        const password = adminPasswordInput.value.trim();

        adminUsernameInput.setCustomValidity(username ? "" : "Informe o usuário.");
        adminPasswordInput.setCustomValidity(password ? "" : "Informe a senha.");

        if (!adminLoginForm.reportValidity()) {
            return;
        }

        try {
            if (adminLoginSubmit) {
                adminLoginSubmit.disabled = true;
            }

            setLoginFeedback("Validando acesso...");
            await loginAdmin(username, password);
            setLoginFeedback("Login realizado com sucesso.", "success");
            window.location.href = getAdminPanelUrl();
        } catch (error) {
            setLoginFeedback(error.message, "error");
        } finally {
            if (adminLoginSubmit) {
                adminLoginSubmit.disabled = false;
            }
        }
    });
}

if (ordersList) {
    if (!getStoredAdminToken()) {
        handleUnauthorizedAccess();
    } else {
        loadOrders();
    }
}
