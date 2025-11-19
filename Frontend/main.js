// Get form + inputs
const loginForm = document.getElementById("login-form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
if (!loginForm || !usernameInput || !passwordInput) {
    console.error("Login form elements missing from DOM.");
}
else {
    loginForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        // ──────────────────────────────
        // Simple validation
        // ──────────────────────────────
        if (!username || !password) {
            alert("Please enter both username and password.");
            return;
        }
        // OPTIONAL strict mock credentials:
        // if (username !== "dr.emily" || password !== "test123") {
        //   alert("Invalid credentials.");
        //   return;
        // }
        // ──────────────────────────────
        // MOCK login success
        // ──────────────────────────────
        const mockSession = {
            username,
            loggedIn: true,
            timestamp: Date.now(),
        };
        // store session in localStorage
        localStorage.setItem("mockSession", JSON.stringify(mockSession));
        // Redirect user to chatbot dashboard
        window.location.href = "chatbot.html";
    });
}
export {};
//# sourceMappingURL=main.js.map