
document.addEventListener("DOMContentLoaded", () => {
    const userData = sessionStorage.getItem("currentUser");
    const token = sessionStorage.getItem("authToken");

    if (!userData || !token) {
        window.location.href = "login.html";
        return;
    }

    try {
        const user = JSON.parse(userData);

        document.getElementById("profile-name").textContent =
            user.name || "Not available";

        document.getElementById("profile-email").textContent =
            user.email || "Not available";
    } catch (error) {
        console.error("Profile loading error:", error);
        document.getElementById("profile-message").textContent =
            "Unable to load profile. Please log in again.";
    }

    document.getElementById("logout-button").addEventListener("click", () => {
        sessionStorage.removeItem("authToken");
        sessionStorage.removeItem("currentUser");

        window.location.href = "login.html";
    });
});
