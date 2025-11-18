// ======================================================
// chatbot.ts — Protect access + Full clinical assistant
// ======================================================


// ─────────────────────────────────────────────
// 1. LOGIN SESSION VALIDATION (mock auth guard)
// ─────────────────────────────────────────────

const rawSession = localStorage.getItem("mockSession");

if (!rawSession) {
  // If user is not logged in, redirect to login page
  window.location.href = "index.html";
  throw new Error("User not logged in — redirecting.");
}

const session = JSON.parse(rawSession) as {
  username: string;
  loggedIn: boolean;
  timestamp: number;
};

if (!session.loggedIn) {
  window.location.href = "index.html";
  throw new Error("Invalid session — redirecting.");
}


// ─────────────────────────────────────────────
// 2. CHATBOT UI HOOKS
// ─────────────────────────────────────────────

const chatWindow = document.getElementById("chat-window") as HTMLDivElement;
const chatForm = document.getElementById("chat-form") as HTMLFormElement;
const chatInput = document.getElementById("chat-input") as HTMLInputElement;
const quickBtns = document.querySelectorAll(".quick-btn");


// ─────────────────────────────────────────────
// 3. UTILITY — Add chat bubble to the UI
// ─────────────────────────────────────────────

function addChatBubble(sender: "bot" | "user", text: string) {
  const div = document.createElement("div");
  div.className = `chat-bubble ${sender}`;
  div.textContent = text;
  chatWindow.appendChild(div);

  // Auto-scroll to bottom
  chatWindow.scrollTop = chatWindow.scrollHeight;
}


// ─────────────────────────────────────────────
// 4. CHATBOT LOGIC — Fake Clinical AI Assistant
// ─────────────────────────────────────────────

function generateReply(userText: string): string {
  const t = userText.toLowerCase();

  if (t.includes("lab") || t.includes("result")) {
    return `Jane's recent labs (10/26/2023):
• Hemoglobin: 11.2 g/dL (Low)
• Potassium: 3.1 mEq/L (Low)
• Creatinine: 1.4 mg/dL (High)
All other values within normal limits.`;
  }

  if (t.includes("med") || t.includes("drug")) {
    return `Active Medications:
• Lisinopril 10mg daily
• Metoprolol 25mg BID
• Simvastatin 20mg nightly`;
  }

  if (t.includes("notes") || t.includes("summary")) {
    return `Recent Provider Notes:
• Patient reports mild dizziness.
• Hydration encouraged.
• BP stable.`;
  }

  return "How can I assist with Jane Doe’s clinical information?";
}


// ─────────────────────────────────────────────
// 5. INITIAL MESSAGE
// ─────────────────────────────────────────────

addChatBubble(
  "bot",
  "Hello! I'm your clinical assistant. How can I help you today?"
);


// ─────────────────────────────────────────────
// 6. FORM SUBMIT — Handle user messages
// ─────────────────────────────────────────────

chatForm.addEventListener("submit", (event: SubmitEvent) => {
  event.preventDefault();

  const text = chatInput.value.trim();
  if (!text) return;

  // User bubble
  addChatBubble("user", text);
  chatInput.value = "";

  // Simulated assistant reply
  setTimeout(() => {
    const botReply = generateReply(text);
    addChatBubble("bot", botReply);
  }, 300);
});


// ─────────────────────────────────────────────
// 7. QUICK ACTION BUTTONS (pre-filled messages)
// ─────────────────────────────────────────────

quickBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const text = btn.textContent || "";
    addChatBubble("user", text);

    setTimeout(() => {
      addChatBubble("bot", generateReply(text));
    }, 300);
  });
});
