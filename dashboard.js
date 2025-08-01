// dashboard.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAMnu2djtDKXMrTVKnppeCfKXRCy1KkEYk",
  authDomain: "lita-platform-bffdc.firebaseapp.com",
  projectId: "lita-platform-bffdc",
  storageBucket: "lita-platform-bffdc.firebasestorage.app",
  messagingSenderId: "387943226211",
  appId: "1:387943226211:web:0127c409e0f880df391156",
  measurementId: "G-44JEYP8ZHD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Role-based routing
const ADMIN_EMAIL = "toolitambrosehenry@gmail.com";

// Monitor sign-in state
onAuthStateChanged(auth, (user) => {
  if (user) {
    const userEmail = user.email;
    const currentPage = window.location.pathname;

    if (userEmail === ADMIN_EMAIL && !currentPage.includes("admin.html")) {
      window.location.href = "admin.html";
    } else if (userEmail !== ADMIN_EMAIL && !currentPage.includes("member.html")) {
      window.location.href = "member.html";
    }
  } else {
    // Not signed in — redirect to sign-in
    if (!window.location.pathname.includes("signin.html")) {
      window.location.href = "signin.html";
    }
  }
});

// Optional logout
window.logout = () => {
  signOut(auth).then(() => {
    window.location.href = "signin.html";
  }).catch((error) => {
    alert("Error signing out: " + error.message);
  });
};
