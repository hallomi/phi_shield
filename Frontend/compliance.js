// compliance.ts — simple handlers
// Check if user is logged in
const session = localStorage.getItem("mockSession");
if (!session) {
    window.location.href = "index.html";
}
const reportBtn = document.querySelector(".generate-btn");
const logoutLink = document.getElementById("logout-link");
reportBtn === null || reportBtn === void 0 ? void 0 : reportBtn.addEventListener("click", () => {
    alert("Report generated successfully! (mock)");
    console.log("Compliance report generated (mock)");
});
logoutLink === null || logoutLink === void 0 ? void 0 : logoutLink.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("mockSession");
    window.location.href = "index.html";
});
// ─────────────────────────────────────────────
// Initialize Charts
// ─────────────────────────────────────────────
function initializeCharts() {
    if (typeof window.Chart === 'undefined') {
        console.error("Chart.js not loaded");
        return;
    }
    // PHI Access Over Time (Bar Graph)
    const phiAccessOverTimeCanvas = document.getElementById("phiAccessOverTimeChart");
    if (phiAccessOverTimeCanvas) {
        const ctx1 = phiAccessOverTimeCanvas.getContext("2d");
        if (ctx1) {
            // Generate data for past 7 days
            const dates = [];
            const accessCounts = [];
            const today = new Date();
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                // Generate increasing trend
                accessCounts.push(Math.floor(Math.random() * 50) + 100 + (6 - i) * 20);
            }
            new window.Chart(ctx1, {
                type: 'bar',
                data: {
                    labels: dates,
                    datasets: [{
                            label: 'PHI Accesses',
                            data: accessCounts,
                            backgroundColor: 'rgba(37, 99, 235, 0.6)',
                            borderColor: 'rgba(37, 99, 235, 1)',
                            borderWidth: 1
                        }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 50
                            }
                        }
                    }
                }
            });
        }
    }
    // PHI Access by User (Bar Graph - timestamp x-axis, user y-axis)
    const phiAccessByUserCanvas = document.getElementById("phiAccessByUserChart");
    if (phiAccessByUserCanvas) {
        const ctx2 = phiAccessByUserCanvas.getContext("2d");
        if (ctx2) {
            // Generate data for users and timestamps
            const users = ['Dr. Jane Smith', 'Dr. John Doe', 'RN. Sarah Lee', 'Dr. Mike Johnson', 'Admin User'];
            const timestamps = [];
            const userAccessData = {};
            // Generate timestamps for past 7 days
            const today = new Date();
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                timestamps.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                // Generate access counts for each user
                users.forEach((user, userIndex) => {
                    if (!userAccessData[user]) {
                        userAccessData[user] = [];
                    }
                    // Generate increasing trend over time
                    userAccessData[user].push(Math.floor(Math.random() * 30) + 10 + (6 - i) * 5 + userIndex * 3);
                });
            }
            const datasets = users.map((user, index) => {
                const colors = [
                    'rgba(37, 99, 235, 0.6)',
                    'rgba(16, 185, 129, 0.6)',
                    'rgba(245, 158, 11, 0.6)',
                    'rgba(239, 68, 68, 0.6)',
                    'rgba(139, 92, 246, 0.6)'
                ];
                const bgColor = colors[index % colors.length] || 'rgba(37, 99, 235, 0.6)';
                return {
                    label: user,
                    data: userAccessData[user],
                    backgroundColor: bgColor,
                    borderColor: bgColor.replace('0.6', '1') || bgColor,
                    borderWidth: 1
                };
            });
            new window.Chart(ctx2, {
                type: 'bar',
                data: {
                    labels: timestamps,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'right'
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Timestamp'
                            }
                        },
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Number of Accesses'
                            },
                            ticks: {
                                stepSize: 20
                            }
                        }
                    }
                }
            });
        }
    }
}
// Initialize charts when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCharts);
}
else {
    initializeCharts();
}
export {};
//# sourceMappingURL=compliance.js.map