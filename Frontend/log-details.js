// log-details.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Check if user is logged in
const session = localStorage.getItem("mockSession");
if (!session) {
    window.location.href = "index.html";
}
console.log("Log Details page loaded.");
const logoutLink = document.getElementById("logout-link");
const updateBtn = document.querySelector(".update-btn");
const exportBtn = document.querySelector(".export-btn");
const postBtn = document.querySelector(".post-btn");
const commentInput = document.querySelector(".comment-input");
// Logout functionality
logoutLink === null || logoutLink === void 0 ? void 0 : logoutLink.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("mockSession");
    window.location.href = "index.html";
});
// Update button
updateBtn === null || updateBtn === void 0 ? void 0 : updateBtn.addEventListener("click", () => {
    alert("Update functionality (mock)");
    console.log("Update clicked");
});
// Export button
exportBtn === null || exportBtn === void 0 ? void 0 : exportBtn.addEventListener("click", () => {
    alert("Exporting log details... (mock)");
    console.log("Export clicked");
});
// Post comment functionality
postBtn === null || postBtn === void 0 ? void 0 : postBtn.addEventListener("click", () => {
    const comment = commentInput === null || commentInput === void 0 ? void 0 : commentInput.value.trim();
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
function loadLogDetails(logId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!logId) {
            console.error("No log ID provided");
            return;
        }
        try {
            const response = yield fetch(`http://localhost:8000/api/logs/${logId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const log = yield response.json();
            // Update page with log data
            updateLogDetails(log);
            console.log("Log details loaded:", log);
        }
        catch (error) {
            console.error("Error loading log details:", error);
        }
    });
}
// Function to update page with log data
function updateLogDetails(log) {
    // Update timestamp
    const timestampEl = document.querySelector(".detail-item .detail-value");
    if (timestampEl && log.timestamp) {
        const timestampItem = Array.from(document.querySelectorAll(".detail-item")).find((item) => { var _a; return ((_a = item.querySelector("label")) === null || _a === void 0 ? void 0 : _a.textContent) === "Timestamp"; });
        if (timestampItem) {
            const valueEl = timestampItem.querySelector(".detail-value");
            if (valueEl)
                valueEl.textContent = log.timestamp;
        }
    }
    // Update user
    const userItem = Array.from(document.querySelectorAll(".detail-item")).find((item) => { var _a; return ((_a = item.querySelector("label")) === null || _a === void 0 ? void 0 : _a.textContent) === "User"; });
    if (userItem && log.userId) {
        const valueEl = userItem.querySelector(".detail-value");
        if (valueEl)
            valueEl.textContent = log.userId;
    }
    // Update patient ID
    const patientItem = Array.from(document.querySelectorAll(".detail-item")).find((item) => { var _a; return ((_a = item.querySelector("label")) === null || _a === void 0 ? void 0 : _a.textContent) === "Patient ID"; });
    if (patientItem && log.patientId) {
        const valueEl = patientItem.querySelector(".detail-value");
        if (valueEl)
            valueEl.textContent = log.patientId;
    }
    // Update risk severity
    const riskItem = Array.from(document.querySelectorAll(".detail-item")).find((item) => { var _a; return ((_a = item.querySelector("label")) === null || _a === void 0 ? void 0 : _a.textContent) === "Risk Severity"; });
    if (riskItem && log.risk) {
        const valueEl = riskItem.querySelector(".detail-value");
        if (valueEl) {
            const riskMap = {
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
        if (queryText)
            queryText.textContent = log.query;
    }
    if (log.llmResponse) {
        const responseText = document.querySelector(".response-text");
        if (responseText)
            responseText.textContent = log.llmResponse;
    }
}
// Load log details on page load
if (logId) {
    loadLogDetails(logId);
}
export {};
//# sourceMappingURL=log-details.js.map