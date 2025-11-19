// compliance.ts — simple handlers

const reportBtn = document.querySelector(".generate-btn") as HTMLButtonElement;

reportBtn?.addEventListener("click", () => {
  alert("Report generated successfully! (mock)");
  console.log("Compliance report generated (mock)");
});

// Add interactions later — filtering alerts, sorting, charts, etc.
