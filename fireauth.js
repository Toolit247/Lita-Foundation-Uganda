// Firebase Config (Ensure this is from the correct Firebase Project)
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

// Sign In Function
document.getElementById("loginForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  firebase.auth().signInWithEmailAndPassword(email, password)
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
