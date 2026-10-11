
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("checkout-form");
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const summary = document.querySelector(".order-summary");
    const totalElement = document.getElementById("checkout-total");

    // Require login before checkout
    const token = sessionStorage.getItem("authToken");

    if (!token) {
        alert("Please log in to proceed to checkout.");
        window.location.href = "login.html";
        return;
    }

    if (cart.length === 0) {
        if (summary) {
            summary.innerHTML = "<h3>Order Summary</h3><p>Your cart is empty.</p>";
        }

        if (form) {
            form.querySelector('button[type="submit"]')?.setAttribute(
                "disabled",
                "true"
            );
        }
        return;
    }

    // Combine duplicate cart products for display and order submission
    const combinedCart = new Map();

    for (const item of cart) {
        const id = String(item.id);
        const existing = combinedCart.get(id);

        if (existing) {
            existing.quantity += 1;
        } else {
            combinedCart.set(id, {
                id: item.id,
                name: item.name,
                price: Number(item.price),
                quantity: 1
            });
        }
    }

    const items = Array.from(combinedCart.values());
    const total = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    if (summary) {
        summary.innerHTML = `
            <h3>Order Summary</h3>
            ${items.map(item => `
                <div class="order-summary-item">
                    <span>${escapeHTML(item.name)} × ${item.quantity}</span>
                    <span>₹${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            `).join("")}
        `;
    }

    if (totalElement) {
        totalElement.textContent = total.toFixed(2);
    }

    if (!form) {
        console.error("Checkout form not found.");
        return;
    }

    form.addEventListener("submit", async event => {
        event.preventDefault();

        const currentToken = sessionStorage.getItem("authToken");

        if (!currentToken) {
            alert("Your login session has expired. Please log in again.");
            window.location.href = "login.html";
            return;
        }

        const submitButton = form.querySelector('button[type="submit"]');

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Placing Order...";
        }

        try {
            const customer = {
                name: document.getElementById("name").value.trim(),
                email: document.getElementById("email").value.trim(),
                phone: document.getElementById("phone").value.trim(),
                address: document.getElementById("address").value.trim()
            };

            const paymentMethod = document.getElementById("payment").value;

            const orderItems = items.map(item => ({
                id: item.id,
                quantity: item.quantity
            }));

            const response = await fetch("/api/orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${currentToken}`
                },
                body: JSON.stringify({
                    customer,
                    items: orderItems,
                    paymentMethod
                })
            });

            const result = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    alert("Your login session has expired. Please log in again.");
                    window.location.href = "login.html";
                    return;
                }

                throw new Error(result.message || "Could not place order.");
            }

            localStorage.setItem("latestOrder", JSON.stringify(result));
            localStorage.removeItem("cart");

            window.location.href = "order-success.html";
        } catch (error) {
            console.error("Checkout error:", error);
            alert(error.message || "Something went wrong.");
        } finally {
            if (submitButton && document.contains(submitButton)) {
                submitButton.disabled = false;
                submitButton.textContent = "Place Order";
            }
        }
    });
});

// Escape product names before rendering them as HTML
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}
