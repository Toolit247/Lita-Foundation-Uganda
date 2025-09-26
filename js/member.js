import { getAuth, onAuthStateChanged, signOut, updatePassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

const auth = getAuth();
const db = getFirestore();
const storage = getStorage();

// Check login state
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const docSnap = await getDoc(doc(db, "members", user.uid));
    if (docSnap.exists()) {
      const data = docSnap.data();
      document.getElementById("profileName").textContent = data.name;
      document.getElementById("profileEmail").textContent = data.email;
      document.getElementById("profileId").textContent = data.manualId;

      if (data.photoURL) {
        document.getElementById("profilePhoto").src = data.photoURL;
      }
    }
  } else {
    window.location.href = "signin.html"; // redirect if not logged in
  }
});

// Upload profile photo
document.getElementById("photoUpload").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const user = auth.currentUser;
  const storageRef = ref(storage, `photos/${user.uid}.jpg`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  await updateDoc(doc(db, "members", user.uid), { photoURL: url });
  document.getElementById("profilePhoto").src = url;

  alert("✅ Profile photo updated!");
});

// Password reset
document.getElementById("resetPassword").addEventListener("click", async () => {
  const newPass = prompt("Enter your new password:");
  if (newPass) {
    await updatePassword(auth.currentUser, newPass);
    alert("✅ Password updated!");
  }
});

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth).then(() => (window.location.href = "signin.html"));
});
