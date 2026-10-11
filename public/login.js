
const form = document.getElementById("login-form");
const message = document.getElementById("message");

form.addEventListener("submit", async event => {
    event.preventDefault();

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    message.textContent = "Logging in...";

    try {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: document.getElementById("email").value.trim(),
                password: document.getElementById("password").value
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Login failed.");
        }

        sessionStorage.setItem("authToken", result.token);
        sessionStorage.setItem("currentUser", JSON.stringify(result.user));

        message.textContent = "Login successful!";

        window.location.href = "index.html";
    } catch (error) {
        message.textContent = error.message;
    } finally {
        button.disabled = false;
    }
});
