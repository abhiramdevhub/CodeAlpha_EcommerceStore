
const form = document.getElementById("register-form");
const message = document.getElementById("message");

form.addEventListener("submit", async event => {
    event.preventDefault();

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    message.textContent = "Creating account...";

    try {
        const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: document.getElementById("name").value.trim(),
                email: document.getElementById("email").value.trim(),
                password: document.getElementById("password").value
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Registration failed.");
        }

        message.textContent = "Registration successful! You can now log in.";
        form.reset();
    } catch (error) {
        message.textContent = error.message;
    } finally {
        button.disabled = false;
    }
});
