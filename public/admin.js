
let adminProducts = [];
let adminOrders = [];

document.addEventListener("DOMContentLoaded", () => {
    const token = sessionStorage.getItem("authToken");
    const userData = sessionStorage.getItem("currentUser");

    if (!token || !userData) {
        window.location.href = "login.html";
        return;
    }

    try {
        const user = JSON.parse(userData);

        if (user.role !== "admin") {
            alert("Admin access required.");
            window.location.href = "index.html";
            return;
        }
    } catch (error) {
        sessionStorage.removeItem("authToken");
        sessionStorage.removeItem("currentUser");
        window.location.href = "login.html";
        return;
    }

    document.getElementById("product-form")
        .addEventListener("submit", addProduct);

    document.getElementById("product-search")
        .addEventListener("input", displayAdminProducts);

    document.getElementById("order-search")
        .addEventListener("input", displayAdminOrders);

    document.getElementById("order-status-filter")
        .addEventListener("change", displayAdminOrders);

    loadAdminProducts();
    loadAdminOrders();
});

function getAdminHeaders() {
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionStorage.getItem("authToken")}`
    };
}

// Load products
async function loadAdminProducts() {
    const container = document.getElementById("admin-products");

    try {
        container.textContent = "Loading products...";

        const response = await fetch("/api/products");
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to load products.");
        }

        if (!Array.isArray(data)) {
            throw new Error("Unexpected products response.");
        }

        adminProducts = data;

        document.getElementById("total-products").textContent =
            adminProducts.length;

        displayAdminProducts();
    } catch (error) {
        console.error("Products error:", error);
        container.textContent = error.message;
    }
}

// Search and display products
function displayAdminProducts() {
    const container = document.getElementById("admin-products");
    const query = document.getElementById("product-search")
        .value.trim().toLowerCase();

    const filtered = adminProducts.filter(product =>
        String(product.name || "").toLowerCase().includes(query)
    );

    if (filtered.length === 0) {
        container.innerHTML = "<p>No matching products found.</p>";
        return;
    }

    container.innerHTML = filtered.map(product => `
        <div class="admin-item">
            <div>
                <h3>${escapeHTML(product.name)}</h3>
                <p>₹${Number(product.price).toLocaleString("en-IN")}</p>
                <p>${escapeHTML(product.description || "")}</p>
            </div>

            <button type="button"
                onclick="editProduct('${product._id}')">Edit</button>

            <button type="button"
                onclick="deleteProduct('${product._id}')">Delete</button>
        </div>
    `).join("");
}

// Add product
async function addProduct(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const message = document.getElementById("product-message");

    const product = {
        name: form.elements["name"].value.trim(),
        price: Number(form.elements["price"].value),
        image: form.elements["image"].value.trim(),
        description: form.elements["description"].value.trim()
    };

    if (!product.name || !product.image ||
        !product.description || product.price <= 0) {
        message.textContent = "Please enter valid product details.";
        return;
    }

    try {
        const response = await fetch("/api/products", {
            method: "POST",
            headers: getAdminHeaders(),
            body: JSON.stringify(product)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to add product.");
        }

        message.textContent = "Product added successfully!";
        form.reset();
        await loadAdminProducts();
    } catch (error) {
        message.textContent = error.message;
    }
}

// Edit product
async function editProduct(id) {
    const product = adminProducts.find(item => item._id === id);

    if (!product) {
        alert("Product not found.");
        return;
    }

    const name = prompt("Product name:", product.name);
    if (name === null) return;

    const priceInput = prompt("Product price:", product.price);
    if (priceInput === null) return;

    const image = prompt("Image URL:", product.image);
    if (image === null) return;

    const description = prompt("Description:", product.description);
    if (description === null) return;

    const updatedProduct = {
        name: name.trim(),
        price: Number(priceInput),
        image: image.trim(),
        description: description.trim()
    };

    if (!updatedProduct.name ||
        !Number.isFinite(updatedProduct.price) ||
        updatedProduct.price <= 0 ||
        !updatedProduct.image ||
        !updatedProduct.description) {
        alert("Please enter valid product details.");
        return;
    }

    try {
        const response = await fetch(`/api/products/${id}`, {
            method: "PUT",
            headers: getAdminHeaders(),
            body: JSON.stringify(updatedProduct)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to update product.");
        }

        alert("Product updated successfully!");
        await loadAdminProducts();
    } catch (error) {
        alert(error.message);
    }
}

// Delete product
async function deleteProduct(id) {
    if (!confirm("Are you sure you want to delete this product?")) {
        return;
    }

    try {
        const response = await fetch(`/api/products/${id}`, {
            method: "DELETE",
            headers: getAdminHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to delete product.");
        }

        alert("Product deleted successfully!");
        await loadAdminProducts();
    } catch (error) {
        alert(error.message);
    }
}

// Load orders
async function loadAdminOrders() {
    const container = document.getElementById("admin-orders");

    try {
        container.textContent = "Loading orders...";

        const response = await fetch("/api/orders/admin", {
            headers: getAdminHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `Request failed (${response.status}).`);
        }

        if (!Array.isArray(data.orders)) {
            throw new Error("Unexpected orders response from server.");
        }

        adminOrders = data.orders;

        document.getElementById("total-orders").textContent =
            data.totalOrders ?? adminOrders.length;

        document.getElementById("total-revenue").textContent =
            `₹${Number(data.totalRevenue || 0).toLocaleString("en-IN")}`;

        displayAdminOrders();
    } catch (error) {
        console.error("Orders error:", error);
        container.textContent = `Could not load orders: ${error.message}`;
    }
}

// Search and filter orders
function displayAdminOrders() {
    const container = document.getElementById("admin-orders");
    const query = document.getElementById("order-search")
        .value.trim().toLowerCase();

    const selectedStatus =
        document.getElementById("order-status-filter").value;

    const filtered = adminOrders.filter(order => {
        const name = String(order.customer?.name || "").toLowerCase();
        const email = String(order.customer?.email || "").toLowerCase();

        const matchesSearch =
            name.includes(query) || email.includes(query);

        const matchesStatus =
            selectedStatus === "All" || order.status === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    if (filtered.length === 0) {
        container.innerHTML = "<p>No matching orders found.</p>";
        return;
    }

    container.innerHTML = filtered.map(order => `
        <div class="admin-section order-card">
            <h3>Order #${escapeHTML(order._id)}</h3>

            <p><strong>Customer:</strong>
                ${escapeHTML(order.customer?.name || "")}
            </p>

            <p><strong>Email:</strong>
                ${escapeHTML(order.customer?.email || "")}
            </p>

            <p><strong>Phone:</strong>
                ${escapeHTML(order.customer?.phone || "")}
            </p>

            <p><strong>Address:</strong>
                ${escapeHTML(order.customer?.address || "")}
            </p>

            <p><strong>Items:</strong></p>

            <ul>
                ${(order.items || []).map(item => `
                    <li>
                        ${escapeHTML(item.name)}
                        × ${Number(item.quantity)}
                        — ₹${Number(item.price) * Number(item.quantity)}
                    </li>
                `).join("")}
            </ul>

            <p><strong>Total:</strong>
                ₹${Number(order.totalAmount).toLocaleString("en-IN")}
            </p>

            <p><strong>Payment:</strong>
                ${escapeHTML(order.paymentMethod || "")}
            </p>

            <p><strong>Date:</strong>
                ${new Date(order.createdAt).toLocaleString("en-IN")}
            </p>

            <label for="status-${order._id}">
                <strong>Order Status:</strong>
            </label>

            <select id="status-${order._id}">
                ${["Pending", "Processing", "Shipped", "Delivered", "Cancelled"]
                    .map(status => `
                        <option value="${status}"
                            ${order.status === status ? "selected" : ""}>
                            ${status}
                        </option>
                    `).join("")}
            </select>

            <button type="button"
                onclick="updateOrderStatus('${order._id}')">
                Update Status
            </button>
        </div>
    `).join("");
}

// Update order status
async function updateOrderStatus(orderId) {
    const select = document.getElementById(`status-${orderId}`);

    if (!select) return;

    try {
        const response = await fetch(
            `/api/orders/admin/${encodeURIComponent(orderId)}/status`,
            {
                method: "PUT",
                headers: getAdminHeaders(),
                body: JSON.stringify({ status: select.value })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to update order status.");
        }

        alert("Order status updated successfully!");
        await loadAdminOrders();
    } catch (error) {
        console.error("Update status error:", error);
        alert(error.message);
    }
}

// Escape HTML
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// Logout
function adminLogout() {
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("currentUser");
    window.location.href = "login.html";
}
