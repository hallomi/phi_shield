// access-policy.ts

// Check if user is logged in
const session = localStorage.getItem("mockSession");
if (!session) {
  window.location.href = "index.html";
}

console.log("Access Policy Management page loaded.");

const addPolicyBtn = document.querySelector(".add-policy-btn") as HTMLButtonElement;
const editButtons = document.querySelectorAll(".action-btn.edit");
const deleteButtons = document.querySelectorAll(".action-btn.delete");
const logoutLink = document.querySelector('a[href="index.html"]') as HTMLAnchorElement;

addPolicyBtn?.addEventListener("click", () => {
  alert("Add New Policy functionality (mock)");
  console.log("Add new policy clicked");
});

editButtons.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const row = (e.target as HTMLElement).closest(".row");
    const roleName = row?.querySelector(".role-name")?.textContent;
    alert(`Edit policy for ${roleName} (mock)`);
  });
});

deleteButtons.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const row = (e.target as HTMLElement).closest(".row");
    const roleName = row?.querySelector(".role-name")?.textContent;
    if (confirm(`Are you sure you want to delete the policy for ${roleName}?`)) {
      alert(`Policy for ${roleName} deleted (mock)`);
    }
  });
});

// Logout functionality
logoutLink?.addEventListener("click", (e) => {
  e.preventDefault();
  localStorage.removeItem("mockSession");
  window.location.href = "index.html";
});

