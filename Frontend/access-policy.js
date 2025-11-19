// access-policy.ts
// Check if user is logged in
const session = localStorage.getItem("mockSession");
if (!session) {
    window.location.href = "index.html";
}
console.log("Access Policy Management page loaded.");
const addPolicyBtn = document.querySelector(".add-policy-btn");
const editButtons = document.querySelectorAll(".action-btn.edit");
const deleteButtons = document.querySelectorAll(".action-btn.delete");
const logoutLink = document.querySelector('a[href="index.html"]');
addPolicyBtn === null || addPolicyBtn === void 0 ? void 0 : addPolicyBtn.addEventListener("click", () => {
    alert("Add New Policy functionality (mock)");
    console.log("Add new policy clicked");
});
editButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
        var _a;
        const row = e.target.closest(".row");
        const roleName = (_a = row === null || row === void 0 ? void 0 : row.querySelector(".role-name")) === null || _a === void 0 ? void 0 : _a.textContent;
        alert(`Edit policy for ${roleName} (mock)`);
    });
});
deleteButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
        var _a;
        const row = e.target.closest(".row");
        const roleName = (_a = row === null || row === void 0 ? void 0 : row.querySelector(".role-name")) === null || _a === void 0 ? void 0 : _a.textContent;
        if (confirm(`Are you sure you want to delete the policy for ${roleName}?`)) {
            alert(`Policy for ${roleName} deleted (mock)`);
        }
    });
});
// Logout functionality
logoutLink === null || logoutLink === void 0 ? void 0 : logoutLink.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("mockSession");
    window.location.href = "index.html";
});
export {};
//# sourceMappingURL=access-policy.js.map