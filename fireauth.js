import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAMnu2djtDKXMrTVKnppeCfKXRCy1KkEYk",
  authDomain: "lita-platform-bffdc.firebaseapp.com",
  projectId: "lita-platform-bffdc",
  storageBucket: "lita-platform-bffdc.appspot.com",
  messagingSenderId: "387943226211",
  appId: "1:387943226211:web:0127c409e0f880df391156",
  measurementId: "G-44JEYP8ZHD"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.getElementById("loginForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then(userCredential => {
      const userEmail = userCredential.user.email;
      if (userEmail === "toolitambrosehenry@gmail.com") {
        window.location.href = "admin.html";
      } else {
        window.location.href = "member.html";
      }
    })
    .catch(error => {
      document.getElementById("loginMessage").textContent = "❌ " + error.message;
    });
});
