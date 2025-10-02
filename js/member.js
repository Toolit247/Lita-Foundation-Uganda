// member.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// ✅ Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAMnu2djtDKXMrTVKnppeCfKXRCy1KkEYk",
  authDomain: "lita-platform-bffdc.firebaseapp.com",
  projectId: "lita-platform-bffdc",
  storageBucket: "lita-platform-bffdc.firebasestorage.app",
  messagingSenderId: "387943226211",
  appId: "1:387943226211:web:0127c409e0f880df391156",
  measurementId: "G-44JEYP8ZHD"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const progressForm = document.getElementById("progressForm");
const progressTable = document.getElementById("progressTable").querySelector("tbody");
const logoutBtn = document.getElementById("logoutBtn");

let currentUserId = null;

// ✅ Submit Progress
progressForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const businessName = document.getElementById("businessName").value;
  const update = document.getElementById("progressUpdate").value;

  if (!businessName || !update) {
    alert("Please fill in all fields.");
    return;
  }

  try {
    await addDoc(collection(db, "members", currentUserId, "progress"), {
      business: businessName,
      update,
      timestamp: serverTimestamp()
    });
    progressForm.reset();
    loadProgress();
  } catch (err) {
    console.error("Error adding progress:", err);
    alert("❌ Failed to submit progress.");
  }
});

// ✅ Load Progress History
async function loadProgress() {
  progressTable.innerHTML = "<tr><td colspan='2'>Loading...</td></tr>";

  try {
    const q = query(
      collection(db, "members", currentUserId, "progress"),
      orderBy("timestamp", "desc")
    );
    const snap = await getDocs(q);

    progressTable.innerHTML = "";
    snap.forEach((doc) => {
      const p = doc.data();
      progressTable.innerHTML += `
        <tr>
          <td>${new Date(p.timestamp?.toDate()).toLocaleString()}</td>
          <td>${p.update}</td>
        </tr>
      `;
    });

    if (snap.empty) {
      progressTable.innerHTML = "<tr><td colspan='2'>No progress yet</td></tr>";
    }
  } catch (err) {
    console.error("Error loading progress:", err);
    progressTable.innerHTML = "<tr><td colspan='2'>❌ Failed to load progress</td></tr>";
  }
}

// ✅ Logout
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "signin.html";
});

// ✅ Auth check
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "signin.html";
  } else {
    currentUserId = user.uid;
    loadProgress();
  }
});
