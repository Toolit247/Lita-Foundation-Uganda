// dashboard.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAMnu2djtDKXMrTVKnppeCfKXRCy1KkEYk",
  authDomain: "lita-platform-bffdc.firebaseapp.com",
  projectId: "lita-platform-bffdc",
  storageBucket: "lita-platform-bffdc.appspot.com",
  messagingSenderId: "387943226211",
  appId: "1:387943226211:web:0127c409e0f880df391156",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const ADMIN_EMAIL = "toolitambrosehenry@gmail.com";

onAuthStateChanged(auth, (user) => {
  const page = window.location.pathname;
  if (user) {
    if (user.email === ADMIN_EMAIL && !page.includes("admin.html")) {
      window.location.href = "admin.html";
    } else if (user.email !== ADMIN_EMAIL && !page.includes("member.html")) {
      window.location.href = "member.html";
    }
  } else {
    if (!page.includes("signin.html")) {
      window.location.href = "signin.html";
    }
  }
});

window.logout = () => {
  signOut(auth)
    .then(() => (window.location.href = "signin.html"))
    .catch((e) => alert("Error signing out: " + e.message));
};
