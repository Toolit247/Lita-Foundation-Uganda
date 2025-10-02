// admin.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// ✅ Firebase config (same as before)
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

const membersTable = document.getElementById("membersTable").querySelector("tbody");
const logoutBtn = document.getElementById("logoutBtn");

// ✅ Render Members with Progress
async function loadMembers() {
  membersTable.innerHTML = "<tr><td colspan='4'>Loading...</td></tr>";

  try {
    const membersSnap = await getDocs(collection(db, "members"));
    membersTable.innerHTML = "";

    for (const memberDoc of membersSnap.docs) {
      const member = memberDoc.data();

      // Fetch progress history
      const progressRef = collection(db, "members", memberDoc.id, "progress");
      const q = query(progressRef, orderBy("timestamp", "desc"));
      const progressSnap = await getDocs(q);

      let progressList = "";
      progressSnap.forEach((doc) => {
        const p = doc.data();
        progressList += `<div><strong>${new Date(p.timestamp?.toDate()).toLocaleString()}:</strong> ${p.update}</div>`;
      });

      membersTable.innerHTML += `
        <tr>
          <td>${member.name || "N/A"}</td>
          <td>${member.email || "N/A"}</td>
          <td>${member.business || "N/A"}</td>
          <td>${progressList || "No progress yet"}</td>
        </tr>
      `;
    }
  } catch (err) {
    console.error("Error loading members:", err);
    membersTable.innerHTML = `<tr><td colspan='4'>❌ Failed to load members</td></tr>`;
  }
}

// ✅ Logout
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "signin.html";
});

// ✅ Auth check
onAuthStateChanged(auth, (user) => {
  if (!user || user.email !== "toolitambrosehenry@gmail.com") {
    window.location.href = "signin.html";
  } else {
    loadMembers();
  }
});
