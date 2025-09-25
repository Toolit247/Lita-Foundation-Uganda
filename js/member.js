const authM = firebase.auth();
const dbM = firebase.firestore();

// Logout
function logout() {
  authM.signOut().then(() => window.location.href = "signin.html");
}

// Load profile
authM.onAuthStateChanged(async user => {
  if (!user) return window.location.href = "signin.html";

  const doc = await dbM.collection("members").doc(user.uid).get();
  if (!doc.exists) {
    alert("Not a registered member.");
    return authM.signOut();
  }
  const data = doc.data();
  document.getElementById("memberName").textContent = data.name;
  document.getElementById("memberEmail").textContent = data.email;
  document.getElementById("memberId").textContent = data.memberId;
  if (data.photoURL) document.getElementById("profilePhoto").src = data.photoURL;

  loadDownline(data.memberId);
});

// Upload photo
document.getElementById("photoUpload").addEventListener("change", async e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onloadend = async () => {
    const base64 = reader.result;
    const user = authM.currentUser;
    await dbM.collection("members").doc(user.uid).update({ photoURL: base64 });
    document.getElementById("profilePhoto").src = base64;
  };
  reader.readAsDataURL(file);
});

// Reset password
function resetPassword() {
  const user = authM.currentUser;
  if (user) {
    authM.sendPasswordResetEmail(user.email)
      .then(() => alert("📧 Password reset email sent."))
      .catch(err => alert("❌ " + err.message));
  }
}

// Load downline
async function loadDownline(myId) {
  const snapshot = await dbM.collection("members").where("uplineId", "==", myId).get();
  renderTree(snapshot.docs.map(d => d.data()));
}
