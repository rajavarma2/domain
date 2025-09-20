// Toggle Login & Signup
function toggleForms() {
  document.getElementById("login-form").classList.toggle("hidden");
  document.getElementById("signup-form").classList.toggle("hidden");
}

// Dummy signup storage
let users = [];

// Signup
function signup() {
  let username = document.getElementById("signup-username").value;
  let email = document.getElementById("signup-email").value;
  let password = document.getElementById("signup-password").value;
  let role = document.getElementById("signup-role").value;

  users.push({ username, email, password, role });
  alert("Signup successful! Please login.");
  toggleForms();
}

// Login
function login() {
  let username = document.getElementById("login-username").value;
  let password = document.getElementById("login-password").value;
  let role = document.getElementById("login-role").value;

  let user = users.find(u => (u.username === username || u.email === username) && u.password === password && u.role === role);

  if (user || (username && password)) { // allow test login
    if (role === "admin") window.location.href = "dashboard.html";
    else if (role === "scheduler") window.location.href = "scheduler.html";
    else if (role === "faculty") window.location.href = "viewer.html";
  } else {
    alert("Invalid credentials!");
  }
}

// Logout
function logout() {
  window.location.href = "index.html";
}

// Dummy timetable generator
function generateTimetable() {
  document.getElementById("progress").classList.remove("hidden");
  setTimeout(() => {
    document.getElementById("progress").innerText = "Timetable Generated (Preview in Viewer)";
  }, 2000);
}

// Approval workflow
function approve() {
  alert("Timetable Approved!");
}
function reject() {
  alert("Timetable Rejected with comments.");
}
