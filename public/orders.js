
document.addEventListener("DOMContentLoaded", loadOrders);

async function loadOrders() {
    const ordersList = document.getElementById("orders-list");
    const token = sessionStorage.getItem("authToken");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch("/api/orders/my-orders", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load orders.");
        }

        const orders = Array.isArray(data) ? data : data.orders;

        if (!orders || orders.length === 0) {
            ordersList.innerHTML = "<p>You have not placed any orders yet.</p>";
            return;
        }

        ordersList.innerHTML = orders.map(order => `
            <div class="order-card">
                <h3>Order #${String(order._id).slice(-6).toUpperCase()}</h3>
                <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
                <p><strong>Total:</strong> ₹${Number(order.totalAmount).toLocaleString("en-IN")}</p>
                <p><strong>Payment:</strong> ${order.paymentMethod}</p>
                <p><strong>Status:</strong> ${order.status}</p>
                <h4>Items</h4>
                <ul>
                    ${order.items.map(item => `
                        <li>${item.name} × ${item.quantity} — ₹${Number(item.price * item.quantity).toLocaleString("en-IN")}</li>
                    `).join("")}
                </ul>
            </div>
        `).join("");
    } catch (error) {
        console.error("Order history error:", error);
        ordersList.innerHTML = "<p>Orders load avvaledu. Please try again.</p>";
    }
}
