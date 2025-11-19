// log-details.ts

// Check if user is logged in
const session = localStorage.getItem("mockSession");
if (!session) {
  window.location.href = "index.html";
}

console.log("Log Details page loaded.");

const logoutLink = document.getElementById("logout-link") as HTMLAnchorElement;
const updateBtn = document.querySelector(".update-btn") as HTMLButtonElement;
const exportBtn = document.querySelector(".export-btn") as HTMLButtonElement;
const postBtn = document.querySelector(".post-btn") as HTMLButtonElement;
const commentInput = document.querySelector(".comment-input") as HTMLTextAreaElement;

// Logout functionality
logoutLink?.addEventListener("click", (e) => {
  e.preventDefault();
  localStorage.removeItem("mockSession");
  window.location.href = "index.html";
});

// Update button
updateBtn?.addEventListener("click", () => {
  alert("Update functionality (mock)");
  console.log("Update clicked");
});

// Export button
exportBtn?.addEventListener("click", () => {
  alert("Exporting log details... (mock)");
  console.log("Export clicked");
});

// Post comment functionality
postBtn?.addEventListener("click", () => {
  const comment = commentInput?.value.trim();
  if (!comment) {
    alert("Please enter a comment.");
    return;
  }

  // Get current user from session
  const sessionData = JSON.parse(session || "{}");
  const userName = sessionData.username || "Current User";
  const currentTime = new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // Create new comment element
  const commentsList = document.querySelector(".comments-list");
  if (commentsList) {
    const commentItem = document.createElement("div");
    commentItem.className = "comment-item";
    commentItem.innerHTML = `
      <div class="comment-avatar">${userName.charAt(0).toUpperCase()}</div>
      <div class="comment-content">
        <div class="comment-header">
          <span class="comment-author">${userName}</span>
          <span class="comment-time">${currentTime}</span>
        </div>
        <div class="comment-text">${comment}</div>
      </div>
    `;
    commentsList.appendChild(commentItem);
    commentInput.value = "";
  }
});

// Get log ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const logId = urlParams.get("id");
console.log("Viewing log ID:", logId);

// Load log details from API
async function loadLogDetails(logId: string | null) {
  if (!logId) {
    console.error("No log ID provided");
    return;
  }

  try {
    const response = await fetch(`http://localhost:8000/api/logs/${logId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const log = await response.json();
    
    // Update page with log data
    updateLogDetails(log);
    console.log("Log details loaded:", log);
  } catch (error) {
    console.error("Error loading log details:", error);
  }
}

// Function to update page with log data
function updateLogDetails(log: any) {
  // Update timestamp
  const timestampEl = document.querySelector(".detail-item .detail-value");
  if (timestampEl && log.timestamp) {
    const timestampItem = Array.from(document.querySelectorAll(".detail-item")).find(
      (item) => item.querySelector("label")?.textContent === "Timestamp"
    );
    if (timestampItem) {
      const valueEl = timestampItem.querySelector(".detail-value");
      if (valueEl) valueEl.textContent = log.timestamp;
    }
  }

  // Update user
  const userItem = Array.from(document.querySelectorAll(".detail-item")).find(
    (item) => item.querySelector("label")?.textContent === "User"
  );
  if (userItem && log.userId) {
    const valueEl = userItem.querySelector(".detail-value");
    if (valueEl) valueEl.textContent = log.userId;
  }

  // Update patient ID
  const patientItem = Array.from(document.querySelectorAll(".detail-item")).find(
    (item) => item.querySelector("label")?.textContent === "Patient ID"
  );
  if (patientItem && log.patientId) {
    const valueEl = patientItem.querySelector(".detail-value");
    if (valueEl) valueEl.textContent = log.patientId;
  }

  // Update risk severity
  const riskItem = Array.from(document.querySelectorAll(".detail-item")).find(
    (item) => item.querySelector("label")?.textContent === "Risk Severity"
  );
  if (riskItem && log.risk) {
    const valueEl = riskItem.querySelector(".detail-value");
    if (valueEl) {
      const riskMap: { [key: string]: string } = {
        "severe": "Severe",
        "high": "High",
        "moderate": "Moderate",
        "safe": "Safe",
        "not-sure": "Not Sure"
      };
      const riskLabel = riskMap[log.risk] || "Not Sure";
      const riskClass = log.risk || "not-sure";
      valueEl.innerHTML = `<span class="risk-badge ${riskClass}"><span class="risk-icon">⚠️</span> ${riskLabel}</span>`;
    }
  }

  // Update query and response
  if (log.query) {
    const queryText = document.querySelector(".query-text");
    if (queryText) queryText.textContent = log.query;
  }

  if (log.llmResponse) {
    const responseText = document.querySelector(".response-text");
    if (responseText) responseText.textContent = log.llmResponse;
  }
}

// Load log details on page load
if (logId) {
  loadLogDetails(logId);
}

