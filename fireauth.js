// Firebase Config
var firebaseConfig = {
  apiKey: "AIzaSyAMnu2djtDKXMrTVKnppeCfKXRCy1KkEYk",
  authDomain: "lita-platform-bffdc.firebaseapp.com",
  projectId: "lita-platform-bffdc",
  storageBucket: "lita-platform-bffdc.appspot.com",
  messagingSenderId: "387943226211",
  appId: "1:387943226211:web:0127c409e0f880df391156"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
console.log("Firebase Initialized");  // Debug Log

// Sign In Function
document.getElementById("loginForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  console.log("Attempting Login with: ", email); // Debug Log

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(userCredential => {
      console.log("Login Success:", userCredential); // Debug Log
      const userEmail = userCredential.user.email;
      if (userEmail === "toolitambrosehenry@gmail.com") {
        window.location.href = "admin.html";
      } else {
        window.location.href = "member.html";
      }
    })
    .catch(error => {
      console.error("Login Failed:", error);  // Debug Log
      document.getElementById("loginMessage").textContent = "❌ " + error.message;
    });
});
