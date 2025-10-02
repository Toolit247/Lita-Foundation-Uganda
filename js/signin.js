// js/signin.js
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    // Redirect based on role
    if (user.email === "toolitambrosehenry@gmail.com") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "member.html";
    }
  }
});

document.getElementById("loginForm").addEventListener("submit", e => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(() => {
      document.getElementById("loginMessage").textContent = "✅ Login successful!";
    })
    .catch(err => {
      document.getElementById("loginMessage").textContent = "❌ " + err.message;
    });
});
