// auth.js — shared Firebase initialization (v8 namespaced)
var firebaseConfig = {
  apiKey: "AIzaSyAMnu2djtDKXMrTVKnppeCfKXRCy1KkEYk",
  authDomain: "lita-platform-bffdc.firebaseapp.com",
  projectId: "lita-platform-bffdc",
  storageBucket: "lita-platform-bffdc.appspot.com",
  messagingSenderId: "387943226211",
  appId: "1:387943226211:web:0127c409e0f880df391156"
};

// initialize primary app (if not already)
try {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase primary app initialized");
  } else {
    console.log("Firebase primary already initialized");
  }
} catch (e) {
  console.warn("Firebase init warning:", e);
}

// Globals for convenience in other scripts
var auth = firebase.auth();
var db = firebase.firestore();
var storage = firebase.storage();

// EmailJS init (public key)
if (typeof emailjs !== "undefined" && emailjs.init) {
  emailjs.init("hZgalRaZwSRy1Zgp4");
}
