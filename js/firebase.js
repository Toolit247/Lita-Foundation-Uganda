// js/firebase.js
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth }  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAMnu2djtDKXMrTVKnppeCfKXRCy1KkEYk",
  authDomain: "lita-platform-bffdc.firebaseapp.com",
  projectId: "lita-platform-bffdc",
  storageBucket: "lita-platform-bffdc.appspot.com",
  messagingSenderId: "387943226211",
  appId: "1:387943226211:web:0127c409e0f880df391156"
};

// initialize app only once
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const firebaseApp = app;
