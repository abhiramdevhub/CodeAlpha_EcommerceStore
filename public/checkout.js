
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("checkout-form");
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const summary = document.getElementById("order-summary");
    const totalElement = document.getElementById("checkout-total");

    if (cart.length === 0) {
        if (summary) {
            summary.innerHTML = "<p>Your cart is empty.</p>";
        }

        if (form) {
            form.querySelector('button[type="submit"]')?.setAttribute(
                "disabled",
                "true"
            );
        }

        return;
    }

    const total = cart.reduce(
        (sum, item) => sum + Number(item.price),
        0
    );

    if (summary) {
        summary.innerHTML = cart.map(item => `
            <div class="order-summary-item">
                <span>${item.name}</span>
                <span>₹${Number(item.price).toFixed(2)}</span>
            </div>
        `).join("");
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

        const submitButton = form.querySelector(
            'button[type="submit"]'
        );

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

            const paymentMethod = document.getElementById(
                "payment"
            ).value;

            const items = cart.map(item => ({
                id: item.id,
                quantity: 1
            }));

            const response = await fetch("/api/orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    customer,
                    items,
                    paymentMethod
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Could not place order."
                );
            }

            localStorage.setItem(
                "latestOrder",
                JSON.stringify(result)
            );

            localStorage.removeItem("cart");

            window.location.href = "order-success.html";
        } catch (error) {
            console.error("Checkout error:", error);
            alert(error.message || "Something went wrong.");

            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Place Order";
            }
        }
    });
});
