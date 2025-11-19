// phi-access.ts

// Check if user is logged in
const session = localStorage.getItem("mockSession");
if (!session) {
  window.location.href = "index.html";
}

console.log("PHI Access Logs page loaded.");

const exportBtn = document.querySelector(".export-btn") as HTMLButtonElement;
const searchInput = document.querySelector(".search-input") as HTMLInputElement;
const filterBtn = document.querySelector(".filter-btn") as HTMLButtonElement;
const logoutLink = document.querySelector('a[href="index.html"]') as HTMLAnchorElement;
const logsTable = document.querySelector(".logs-table") as HTMLElement;

// Risk mapping
const riskMap: { [key: string]: { label: string; class: string } } = {
  "severe": { label: "Severe", class: "severe" },
  "high": { label: "High", class: "high" },
  "moderate": { label: "Moderate", class: "moderate" },
  "safe": { label: "Safe", class: "safe" },
  "not-sure": { label: "Not Sure", class: "not-sure" }
};

// Function to format timestamp
function formatTimestamp(timestamp: string): string {
  return timestamp; // Already formatted from backend
}

// Function to get user display name from userId
function getUserDisplayName(userId: string): string {
  // Extract name from email or return as is
  if (userId.includes("@")) {
    const parts = userId.split("@")[0];
    if (parts) {
      // Handle doctorJane@doctor.com -> Dr. Jane
      if (parts.toLowerCase().includes("doctor")) {
        const name = parts.replace(/doctor/gi, "").trim();
        if (name) {
          return `Dr. ${name.charAt(0).toUpperCase() + name.slice(1)}`;
        }
        return "Dr. " + parts.charAt(0).toUpperCase() + parts.slice(1);
      }
      // Handle other formats
      const formatted = parts.split(".").map(part => 
        part.charAt(0).toUpperCase() + part.slice(1)
      ).join(" ");
      return formatted || parts.charAt(0).toUpperCase() + parts.slice(1);
    }
  }
  return userId;
}

// Function to render log rows
function renderLogRows(logs: any[]) {
  if (!logsTable) return;
  
  // Get header row
  const headerRow = logsTable.querySelector(".row.header");
  if (!headerRow) return;
  
  // Clear existing rows (except header)
  const existingRows = logsTable.querySelectorAll(".row.clickable");
  existingRows.forEach(row => row.remove());
  
  // Sort logs by timestamp (newest first)
  const sortedLogs = [...logs].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
  
  // Render each log
  sortedLogs.forEach((log) => {
    const row = document.createElement("div");
    row.className = "row clickable";
    row.setAttribute("data-log-id", log.id.toString());
    
    const risk = riskMap[log.risk] || riskMap["not-sure"];
    const riskClass = risk?.class || "not-sure";
    const riskLabel = risk?.label || "Not Sure";
    
    row.innerHTML = `
      <div>${formatTimestamp(log.timestamp)}</div>
      <div>${getUserDisplayName(log.userId)}</div>
      <div>${log.patientId}</div>
      <div><span class="risk-badge ${riskClass}">${riskLabel}</span></div>
      <div>${log.details || log.query}</div>
    `;
    
    // Add click handler
    row.addEventListener("click", () => {
      window.location.href = `log-details.html?id=${log.id}`;
    });
    
    logsTable.appendChild(row);
  });
}

// Function to fetch logs from API
// Note: Postman mock server doesn't support GET /api/logs endpoint
// Logs will be updated via the logUpdated event when chatbot sends requests
async function fetchLogs() {
  try {
    // Try to fetch from local backend if available
    const response = await fetch("http://localhost:8000/api/logs");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const logs = await response.json();
    renderLogRows(logs);
    console.log("Logs loaded:", logs);
  } catch (error) {
    console.error("Error fetching logs:", error);
    // Keep existing static logs if API fails
    // Logs will be added dynamically via logUpdated events
  }
}

// Function to add log entry to table
function addLogToTable(log: any) {
  if (!logsTable || !log) return;
  
  const headerRow = logsTable.querySelector(".row.header");
  if (!headerRow) return;
  
  // Always add log entry (duplicates allowed)
  
  // Create new row
  const row = document.createElement("div");
  row.className = "row clickable";
  row.setAttribute("data-log-id", log.id?.toString() || Date.now().toString());
  
  const risk = riskMap[log.risk] || riskMap["not-sure"];
  const riskClass = risk?.class || "not-sure";
  const riskLabel = risk?.label || "Not Sure";
  
  row.innerHTML = `
    <div>${log.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19)}</div>
    <div>${getUserDisplayName(log.userId)}</div>
    <div>${log.patientId}</div>
    <div><span class="risk-badge ${riskClass}">${riskLabel}</span></div>
    <div>${log.details || log.query}</div>
  `;
  
  // Add click handler
  row.addEventListener("click", () => {
    window.location.href = `log-details.html?id=${log.id}`;
  });
  
  // Insert after header row (at the top)
  headerRow.insertAdjacentElement("afterend", row);
  
  console.log("New log entry added to table:", log);
}

// Load logs from localStorage on page load
function loadLogsFromStorage() {
  try {
    const storedLogs = localStorage.getItem("phiAccessLogs");
    if (storedLogs) {
      const logs = JSON.parse(storedLogs);
      // Render all logs
      logs.forEach((log: any) => {
        addLogToTable(log);
      });
      console.log("Loaded logs from localStorage:", logs.length);
    }
  } catch (error) {
    console.error("Error loading logs from storage:", error);
  }
}

// Load logs on page load
fetchLogs();
loadLogsFromStorage();

// Listen for log updates from chatbot (same tab)
window.addEventListener("logUpdated", (event: any) => {
  console.log("Log updated event received:", event.detail);
  if (event.detail) {
    addLogToTable(event.detail);
  }
});

// Listen for storage changes (cross-tab communication)
window.addEventListener("storage", (event) => {
  if (event.key === "phiLogsUpdated") {
    console.log("Logs updated in another tab, refreshing...");
    // Clear existing rows and reload from storage
    const existingRows = logsTable.querySelectorAll(".row.clickable");
    existingRows.forEach(row => row.remove());
    loadLogsFromStorage();
  }
});

// Poll for updates every 2 seconds (fallback for cross-tab)
let lastUpdateTime = localStorage.getItem("phiLogsUpdated") || "0";
setInterval(() => {
  const currentUpdateTime = localStorage.getItem("phiLogsUpdated") || "0";
  if (currentUpdateTime !== lastUpdateTime) {
    lastUpdateTime = currentUpdateTime;
    console.log("Detected log update, refreshing...");
    // Reload logs from storage
    const existingRows = logsTable.querySelectorAll(".row.clickable");
    existingRows.forEach(row => row.remove());
    loadLogsFromStorage();
  }
}, 2000);

exportBtn?.addEventListener("click", () => {
  alert("Exporting logs... (mock)");
  console.log("Export logs clicked");
});

filterBtn?.addEventListener("click", () => {
  alert("Filter options (mock)");
  console.log("Filter clicked");
});

// Search functionality
searchInput?.addEventListener("input", (e) => {
  const query = (e.target as HTMLInputElement).value;
  console.log("Searching for:", query);
  // Future: implement actual search filtering
});

// Logout functionality
logoutLink?.addEventListener("click", (e) => {
  e.preventDefault();
  localStorage.removeItem("mockSession");
  window.location.href = "index.html";
});

// Make rows clickable to navigate to log details
const logRows = document.querySelectorAll(".row.clickable");
logRows.forEach((row) => {
  row.addEventListener("click", () => {
    const logId = (row as HTMLElement).getAttribute("data-log-id");
    window.location.href = `log-details.html?id=${logId}`;
  });
});
