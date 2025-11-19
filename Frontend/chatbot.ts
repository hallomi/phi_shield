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
// 3. UTILITY — Format patient data response
// ─────────────────────────────────────────────

function formatPatientResponse(rawText: string): string {
  // Check if this looks like patient data
  if (rawText.includes("Patient") && (rawText.includes("BP") || rawText.includes("HR"))) {
    let formatted = "📋 **Patient Summary**\n\n";
    
    // Extract patient ID and name (e.g., "Patient PID-00123, John Doe")
    const patientMatch = rawText.match(/Patient\s+([^,]+),\s*([^.]+?)(?:\s+presented|$)/);
    if (patientMatch && patientMatch[1] && patientMatch[2]) {
      formatted += `**Patient:** ${patientMatch[1]} - ${patientMatch[2].trim()}\n\n`;
    }
    
    // Extract presentation date
    const dateMatch = rawText.match(/presented on (\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      formatted += `**Presentation Date:** ${dateMatch[1]}\n\n`;
    }
    
    // Extract symptoms
    const symptomsMatch = rawText.match(/with symptoms of ([^.]+)/);
    if (symptomsMatch) {
      formatted += `**Symptoms:** ${symptomsMatch[1]}\n\n`;
    }
    
    // Extract vitals
    formatted += "**Vitals:**\n";
    const bpMatches = rawText.match(/BP\s+(\d+\/\d+)\s+mmHg/g);
    if (bpMatches) {
      bpMatches.forEach((bp, index) => {
        const bpValue = bp.match(/(\d+\/\d+)/);
        if (bpValue) {
          if (index === 0) {
            formatted += `• Blood Pressure: ${bpValue[1]} mmHg\n`;
          } else {
            formatted += `• Follow-up BP: ${bpValue[1]} mmHg\n`;
          }
        }
      });
    }
    const hrMatch = rawText.match(/HR\s+(\d+)\s+bpm/);
    if (hrMatch) formatted += `• Heart Rate: ${hrMatch[1]} bpm\n`;
    
    // Extract prescribed medications
    const prescribedMatch = rawText.match(/Prescribed\s+([^.]+)/);
    if (prescribedMatch) {
      formatted += `\n**Prescribed:**\n`;
      formatted += `• ${prescribedMatch[1]}\n`;
    }
    
    // Extract follow-up info
    const followUpMatch = rawText.match(/Follow-up on (\d{4}-\d{2}-\d{2})[^:]*:\s*([^.]+)/);
    if (followUpMatch) {
      formatted += `\n**Follow-up (${followUpMatch[1]}):**\n`;
      formatted += `• ${followUpMatch[2]}\n`;
    }
    
    // Extract current medications
    const medMatch = rawText.match(/Current medications:\s*([^.]+)/);
    if (medMatch && medMatch[1]) {
      formatted += `\n**Current Medications:**\n`;
      const meds = medMatch[1].split(',').map(m => m.trim());
      meds.forEach(med => formatted += `• ${med}\n`);
    }
    
    // Extract lab results
    const labMatch = rawText.match(/Lab results[^:]*:\s*([^.]+)/);
    if (labMatch) {
      formatted += `\n**Lab Results:**\n`;
      formatted += `• ${labMatch[1]}\n`;
    }
    
    // Extract allergies
    const allergyMatch = rawText.match(/No known drug allergies/);
    if (allergyMatch) {
      formatted += `\n**Allergies:** None\n`;
    }
    
    return formatted;
  }
  
  return rawText;
}

// ─────────────────────────────────────────────
// 4. UTILITY — Add chat bubble to the UI
// ─────────────────────────────────────────────

function addChatBubble(sender: "bot" | "user", text: string, isFormatted: boolean = false) {
  const div = document.createElement("div");
  div.className = `chat-bubble ${sender}`;
  
  if (isFormatted && sender === "bot") {
    // Create formatted content with HTML
    const formattedText = formatPatientResponse(text);
    div.innerHTML = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  } else {
    div.textContent = text;
  }
  
  chatWindow.appendChild(div);

  // Auto-scroll to bottom
  chatWindow.scrollTop = chatWindow.scrollHeight;
}


// ─────────────────────────────────────────────
// 5. CHATBOT LOGIC — Fake Clinical AI Assistant
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
// 6. INITIALIZE VITALS CHARTS
// ─────────────────────────────────────────────

function initializeVitalsCharts() {
  if (typeof (window as any).Chart === 'undefined') {
    console.error("Chart.js not loaded");
    return;
  }

  // Blood Pressure Chart
  const bpCanvas = document.getElementById("bloodPressureChart") as HTMLCanvasElement;
  if (bpCanvas) {
    const ctx1 = bpCanvas.getContext("2d");
    if (ctx1) {
      // Generate data for last 24 hours (25 data points)
      const hours = Array.from({ length: 25 }, (_, i) => i);
      const systolicData = hours.map(h => 117 + (h / 25) * 2); // Gradual increase from 117 to 119
      const diastolicData = hours.map(h => 78 + (h / 25) * 2); // Gradual increase from 78 to 80

      new (window as any).Chart(ctx1, {
        type: 'line',
        data: {
          labels: hours,
          datasets: [
            {
              label: 'Systolic (mmHg)',
              data: systolicData,
              borderColor: 'rgb(255, 159, 64)',
              backgroundColor: 'rgba(255, 159, 64, 0.1)',
              tension: 0.4,
              fill: false
            },
            {
              label: 'Diastolic (mmHg)',
              data: diastolicData,
              borderColor: 'rgb(54, 162, 235)',
              backgroundColor: 'rgba(54, 162, 235, 0.1)',
              tension: 0.4,
              fill: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Blood Pressure Over Last 24 Hours',
              font: {
                size: 12
              }
            },
            legend: {
              display: true,
              position: 'top'
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Hours'
              },
              ticks: {
                stepSize: 5
              }
            },
            y: {
              title: {
                display: true,
                text: 'Blood Pressure (mmHg)'
              },
              min: 70,
              max: 125
            }
          }
        }
      });
    }
  }

  // Heart Rate Chart
  const hrCanvas = document.getElementById("heartRateChart") as HTMLCanvasElement;
  if (hrCanvas) {
    const ctx2 = hrCanvas.getContext("2d");
    if (ctx2) {
      // Generate data for last 24 hours (25 data points)
      const hours = Array.from({ length: 25 }, (_, i) => i);
      const hrData = hours.map(h => 72.7 - (h / 25) * 0.7); // Gradual decrease from 72.7 to 72.0

      new (window as any).Chart(ctx2, {
        type: 'line',
        data: {
          labels: hours,
          datasets: [{
            label: 'Heart Rate (bpm)',
            data: hrData,
            borderColor: 'rgb(255, 159, 64)',
            backgroundColor: 'rgba(255, 159, 64, 0.1)',
            tension: 0.4,
            fill: false
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Heart Rate Over Last 24 Hours',
              font: {
                size: 12
              }
            },
            legend: {
              display: true,
              position: 'top'
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Hours'
              },
              ticks: {
                stepSize: 5
              }
            },
            y: {
              title: {
                display: true,
                text: 'Heart Rate (bpm)'
              },
              min: 71.5,
              max: 73.0
            }
          }
        }
      });
    }
  }
}

// ─────────────────────────────────────────────
// 7. INITIAL MESSAGE
// ─────────────────────────────────────────────

addChatBubble(
  "bot",
  "Hello! I'm your clinical assistant. How can I help you today?"
);

// Initialize vitals charts when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeVitalsCharts);
} else {
  initializeVitalsCharts();
}


// ─────────────────────────────────────────────
// 8. FORM SUBMIT — Handle user messages with POST request
// ─────────────────────────────────────────────

chatForm.addEventListener("submit", async (event: SubmitEvent) => {
  event.preventDefault();

  const text = chatInput.value.trim();
  if (!text) return;

  // User bubble
  addChatBubble("user", text);
  chatInput.value = "";

  // Get userId and patientId
  const userId = session.username; // e.g., doctorJane@doctor.com
  const patientId = "patient4321"; // Fixed patient ID as per requirement

  // Prepare POST request data with exactly 3 fields
  const requestData = {
    userId: userId,
    patientId: patientId,
    query: text
  };
  
  console.log("Sending request:", requestData);

  try {
    // Send POST request to Postman mock server
    const apiUrl = "https://c0074f0b-01c8-427c-bd8e-dee11ffa6261.mock.pstmn.io/api/chat";
    console.log("Sending POST request to:", apiUrl);
    console.log("Request data:", requestData);
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    console.log("Response status:", response.status);
    console.log("Response ok:", response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Response error:", errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const responseData = await response.json();
    
    console.log("Full response data:", responseData);
    
    // Add 2000ms delay before showing response
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Handle response - check multiple possible response fields
    // The mock server might return: log, response, message, or llmResponse
    const botReply = responseData.log || 
                     responseData.response || 
                     responseData.message || 
                     responseData.llmResponse || 
                     JSON.stringify(responseData);
    
    console.log("Bot reply to display:", botReply);
    
    // Check if this is patient data that should be formatted
    const isPatientData = botReply.includes("Patient") && 
                          (botReply.includes("BP") || botReply.includes("HR") || botReply.includes("blood pressure"));
    
    // Display the structured response
    addChatBubble("bot", botReply, isPatientData);

    // Log the response for debugging
    console.log("Chat response:", responseData);
    
    // Store log entry in localStorage for cross-tab communication
    if (responseData.logEntry) {
      const existingLogs = JSON.parse(localStorage.getItem("phiAccessLogs") || "[]");
      // Always add log entry (no duplicate check)
      existingLogs.unshift(responseData.logEntry); // Add to beginning
      localStorage.setItem("phiAccessLogs", JSON.stringify(existingLogs));
      // Set a flag to notify other tabs
      localStorage.setItem("phiLogsUpdated", Date.now().toString());
    }
    
    // Trigger log list refresh in PHI Access Logs page (if open in same tab)
    window.dispatchEvent(new CustomEvent("logUpdated", { detail: responseData.logEntry }));
  } catch (error) {
    console.error("Error sending chat request:", error);
    // Fallback to local reply if API fails
    const botReply = generateReply(text);
    addChatBubble("bot", botReply);
    addChatBubble("bot", "[Note: Using local fallback - API connection failed]");
  }
});


// ─────────────────────────────────────────────
// 9. QUICK ACTION BUTTONS (pre-filled messages with POST)
// ─────────────────────────────────────────────

quickBtns.forEach(btn => {
  btn.addEventListener("click", async () => {
    const text = btn.textContent || "";
    addChatBubble("user", text);

    // Get userId and patientId
    const userId = session.username;
    const patientId = "patient4321";

    // Prepare POST request data with exactly 3 fields
    const requestData = {
      userId: userId,
      patientId: patientId,
      query: text
    };
    
    console.log("Sending quick action request:", requestData);

    try {
      // Send POST request to Postman mock server
      const apiUrl = "https://c0074f0b-01c8-427c-bd8e-dee11ffa6261.mock.pstmn.io/api/chat";
      console.log("Sending quick action POST request to:", apiUrl);
      console.log("Request data:", requestData);
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      console.log("Quick action response status:", response.status);
      console.log("Quick action response ok:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Quick action response error:", errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const responseData = await response.json();
      
      console.log("Quick action full response data:", responseData);
      
      // Add 2000ms delay before showing response
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Handle response - check multiple possible response fields
      const botReply = responseData.log || 
                       responseData.response || 
                       responseData.message || 
                       responseData.llmResponse || 
                       generateReply(text);
      
      // Check if this is patient data that should be formatted
      const isPatientData = botReply.includes("Patient") && 
                            (botReply.includes("BP") || botReply.includes("HR") || botReply.includes("blood pressure"));
      
      // Display the structured response
      addChatBubble("bot", botReply, isPatientData);

      console.log("Quick action response:", responseData);
      
      // Store log entry in localStorage for cross-tab communication
      if (responseData.logEntry) {
        const existingLogs = JSON.parse(localStorage.getItem("phiAccessLogs") || "[]");
        // Always add log entry (no duplicate check)
        existingLogs.unshift(responseData.logEntry); // Add to beginning
        localStorage.setItem("phiAccessLogs", JSON.stringify(existingLogs));
        // Set a flag to notify other tabs
        localStorage.setItem("phiLogsUpdated", Date.now().toString());
      }
      
      // Trigger log list refresh in PHI Access Logs page (if open in same tab)
      window.dispatchEvent(new CustomEvent("logUpdated", { detail: responseData.logEntry }));
    } catch (error) {
      console.error("Error sending quick action request:", error);
      // Fallback to local reply
      const botReply = generateReply(text);
      addChatBubble("bot", botReply);
    }
  });
});
