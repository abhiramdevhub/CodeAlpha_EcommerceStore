
let cart = JSON.parse(localStorage.getItem("cart")) || [];

async function loadProductDetails() {
    const container = document.getElementById("product-details");

    if (!container) {
        console.error("Product details container not found.");
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id");

    if (!productId) {
        container.innerHTML = "<p>Product ID not found.</p>";
        return;
    }

    try {
        const response = await fetch("/api/products");

        if (!response.ok) {
            throw new Error("Failed to load products");
        }

        const products = await response.json();

        const product = products.find(
            item => String(item._id) === String(productId)
        );

        if (!product) {
            container.innerHTML = "<p>Product not found.</p>";
            return;
        }

        container.innerHTML = `
            <div class="product-detail-card">
                <img src="${product.image}" alt="${product.name}">

                <div class="product-detail-info">
                    <h2>${product.name}</h2>
                    <h3>₹${product.price}</h3>
                    <p>${product.description}</p>

                    <button onclick="addToCart('${product._id}')">
                        Add to Cart
                    </button>

                    <button onclick="window.location.href='index.html'">
                        Back to Products
                    </button>
                </div>
            </div>
        `;

        window.currentProduct = product;
    } catch (error) {
        console.error("Product details error:", error);
        container.innerHTML =
            "<p>Unable to load product details. Please try again.</p>";
    }
}

function addToCart(productId) {
    const product = window.currentProduct;

    if (!product || String(product._id) !== String(productId)) {
        alert("Product not found. Please refresh the page.");
        return;
    }

    const cartProduct = {
        id: product._id,
        name: product.name,
        price: Number(product.price),
        image: product.image,
        description: product.description
    };

    cart.push(cartProduct);
    localStorage.setItem("cart", JSON.stringify(cart));

    alert(product.name + " added to cart!");
}

document.addEventListener("DOMContentLoaded", loadProductDetails);
