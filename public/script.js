
let products = [];
let cart = [];

function loadSavedCart() {
    try {
        const savedCart = JSON.parse(localStorage.getItem("cart") || "[]");
        return Array.isArray(savedCart) ? savedCart : [];
    } catch (error) {
        console.error("Cart loading error:", error);
        return [];
    }
}

cart = loadSavedCart();

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function getImageUrl(image) {
    if (typeof image !== "string" || !image.trim()) {
        return "https://placehold.co/300x220?text=No+Image";
    }

    const value = image.trim();

    if (/^(https?:\/\/|\/)/i.test(value)) {
        return value;
    }

    return "/" + value.replace(/^\.?\//, "");
}

async function loadProducts() {
    const productList = document.getElementById("product-list");
    if (!productList) return;

    productList.innerHTML = "<p>Loading products...</p>";

    try {
        const response = await fetch("/api/products");

        if (!response.ok) {
            throw new Error("Failed to load products");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("Unexpected product response");
        }

        products = data.map((product) => ({
            id: String(product._id || product.id || ""),
            name: product.name || "Unnamed Product",
            price: Number(product.price),
            image: getImageUrl(product.image),
            description: product.description || "No description available."
        })).filter((product) =>
            product.id && Number.isFinite(product.price) && product.price >= 0
        );

        displayProducts();
    } catch (error) {
        console.error("Product loading error:", error);
        productList.innerHTML =
            "<p>Products load avvaledu. Please refresh the page.</p>";
    }
}

function displayProducts() {
    const productList = document.getElementById("product-list");
    if (!productList) return;

    if (products.length === 0) {
        productList.innerHTML = "<p>No products available.</p>";
        return;
    }

    productList.innerHTML = products.map((product) => `
        <div class="product-card">
            <img
                src="${escapeHTML(product.image)}"
                alt="${escapeHTML(product.name)}"
                loading="lazy"
                onerror="this.onerror=null;this.src='https://placehold.co/300x220?text=No+Image';"
            >
            <h3>${escapeHTML(product.name)}</h3>
            <p>₹${product.price.toFixed(2)}</p>

            <button type="button" onclick="addToCart('${escapeHTML(product.id)}')">
                Add to Cart
            </button>

            <button type="button"
                style="margin-top:8px;"
                onclick="viewProduct('${escapeHTML(product.id)}')">
                View Details
            </button>
        </div>
    `).join("");
}

function viewProduct(productId) {
    window.location.href =
        `product.html?id=${encodeURIComponent(productId)}`;
}

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

function updateCartCount() {
    const cartCount = document.getElementById("cart-count");
    if (cartCount) {
        cartCount.textContent = cart.length;
    }
}

function addToCart(productId) {
    const product = products.find(
        (item) => String(item.id) === String(productId)
    );

    if (!product) {
        alert("Product not found. Please refresh the page.");
        return;
    }

    cart.push({
        id: product.id,
        _id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        description: product.description
    });

    saveCart();
    updateCartCount();

    const cartPanel = document.getElementById("cart-panel");
    if (cartPanel?.classList.contains("active")) {
        displayCart();
    }

    alert(`${product.name} added to cart!`);
}

function showCart() {
    const cartPanel = document.getElementById("cart-panel");
    if (!cartPanel) return;

    cartPanel.classList.add("active");
    displayCart();
}

function closeCart() {
    const cartPanel = document.getElementById("cart-panel");
    if (cartPanel) {
        cartPanel.classList.remove("active");
    }
}

function displayCart() {
    const cartItems = document.getElementById("cart-items");
    const cartTotal = document.getElementById("cart-total");

    if (!cartItems || !cartTotal) return;

    if (cart.length === 0) {
        cartItems.innerHTML = "<p>Your cart is empty.</p>";
        cartTotal.textContent = "0.00";
        return;
    }

    cartItems.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
            <div>
                <h4>${escapeHTML(item.name)}</h4>
                <p>₹${Number(item.price).toFixed(2)}</p>
            </div>
            <button type="button" class="remove-btn"
                onclick="removeFromCart(${index})">
                Remove
            </button>
        </div>
    `).join("");

    const total = cart.reduce(
        (sum, item) => sum + Number(item.price),
        0
    );

    cartTotal.textContent = total.toFixed(2);
}

function removeFromCart(index) {
    if (!Number.isInteger(index) || index < 0 || index >= cart.length) {
        return;
    }

    cart.splice(index, 1);
    saveCart();
    updateCartCount();
    displayCart();
}

function checkout() {
    if (cart.length === 0) {
        alert("Your cart is empty.");
        return;
    }

    const token = sessionStorage.getItem("authToken");

    if (!token) {
        alert("Please log in to proceed to checkout.");
        window.location.href = "login.html";
        return;
    }

    window.location.href = "checkout.html";
}

function showLoginLinks(userMenu) {
    userMenu.innerHTML = `
        <a href="login.html">Login</a>
        <a href="register.html">Register</a>
    `;
}

function updateUserMenu() {
    const userMenu = document.getElementById("user-menu");
    if (!userMenu) return;

    const token = sessionStorage.getItem("authToken");
    const userData = sessionStorage.getItem("currentUser");

    if (token && userData) {
        try {
            const user = JSON.parse(userData);

            userMenu.innerHTML = `
                <span>Hi, ${escapeHTML(user.name || "User")}</span>
                <a href="profile.html">My Profile</a>
                <a href="orders.html">My Orders</a>
                ${user.role === "admin"
                    ? '<a href="admin.html">Admin Dashboard</a>'
                    : ""}
                <button type="button" onclick="logoutUser()">Logout</button>
            `;
            return;
        } catch (error) {
            console.error("User session error:", error);
            sessionStorage.removeItem("authToken");
            sessionStorage.removeItem("currentUser");
        }
    }

    showLoginLinks(userMenu);
}

function logoutUser() {
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("currentUser");
    window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", () => {
    cart = loadSavedCart();
    updateCartCount();
    updateUserMenu();
    loadProducts();
});
