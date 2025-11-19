// -------------------------------
// Types
// -------------------------------
type LoginResult = {
  success: boolean;
  message: string;
};

// Get form + inputs
const loginForm = document.getElementById("login-form") as HTMLFormElement | null;
const usernameInput = document.getElementById("username") as HTMLInputElement | null;
const passwordInput = document.getElementById("password") as HTMLInputElement | null;

if (!loginForm || !usernameInput || !passwordInput) {
  console.error("Login form elements missing from DOM.");
} else {

  loginForm.addEventListener("submit", (event: SubmitEvent) => {
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
