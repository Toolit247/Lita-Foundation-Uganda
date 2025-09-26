// js/member.js
import { auth, db, storage } from './firebase.js';
import { onAuthStateChanged, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { ref as sRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

const logoutBtn = document.getElementById("logoutBtn");
const photoInput = document.getElementById("photoUpload");
const profilePhotoEl = document.getElementById("profilePhoto");

onAuthStateChanged(auth, async (user) => {
  if (!user) return window.location.href = "signin.html";
  const uid = user.uid;
  const docRef = doc(db, "members", uid);
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    alert("You are not registered. Contact admin.");
    await auth.signOut();
    return window.location.href = "signin.html";
  }
  const data = snap.data();
  document.getElementById("m_name").textContent = data.fullName || data.name || "";
  document.getElementById("m_email").textContent = data.email || "";
  document.getElementById("m_memberId").textContent = data.memberId || "";
  document.getElementById("m_upline").textContent = data.upline || "";
  if (data.photoURL) profilePhotoEl.src = data.photoURL;

  // show tree of downlines for this member
  const allSnap = await getDocs(collection(db, "members"));
  const members = allSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  window.renderTreeInContainer && window.renderTreeInContainer(members, document.getElementById("treeContainer"), data.memberId);
});

// upload profile photo
photoInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const user = auth.currentUser;
  if (!user) return alert("Not logged in");
  const ref = sRef(storage, `profile_photos/${user.uid}/${Date.now()}_${file.name}`);
  const res = await uploadBytes(ref, file);
  const url = await getDownloadURL(res.ref);
  // update firestore
  await import("https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js").then(mod => mod.updateDoc(doc(db, "members", user.uid), { photoURL: url })).catch(()=>{});
  document.getElementById("profilePhoto").src = url;
  alert("Profile photo uploaded.");
});

// reset password (send reset email)
document.getElementById("resetPwd").addEventListener("click", () => {
  const user = auth.currentUser;
  if (!user) return alert("Not signed in");
  sendPasswordResetEmail(auth, user.email)
    .then(()=> alert("Password reset email sent."))
    .catch(err=> alert("Error: " + err.message));
});

// logout
logoutBtn.addEventListener("click", () => auth.signOut().then(()=> window.location.href="signin.html"));
