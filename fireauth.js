// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAMnu2djtDKXMrTVKnppeCfKXRCy1KkEYk",
  authDomain: "lita-platform-bffdc.firebaseapp.com",
  projectId: "lita-platform-bffdc",
  storageBucket: "lita-platform-bffdc.appspot.com",
  messagingSenderId: "387943226211",
  appId: "1:387943226211:web:0127c409e0f880df391156",
  measurementId: "G-44JEYP8ZHD"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Login Form Submission
document.getElementById("loginForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
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
