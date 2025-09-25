// member.js — Member dashboard behavior: load profile, upload photo, reset password, update progress, show downline

const MEMBERS_COLLECTION = "members";

let memberDocRef = null;
let myMemberId = null;

firebase.auth().onAuthStateChanged(async user => {
  if (!user) {
    window.location.href = "signin.html";
    return;
  }
  // get member profile doc by uid
  const doc = await db.collection(MEMBERS_COLLECTION).doc(user.uid).get();
  if (!doc.exists) {
    // not registered as member — sign out
    await firebase.auth().signOut();
    alert("Access denied: you are not registered as a member.");
    window.location.href = "signin.html";
    return;
  }
  memberDocRef = db.collection(MEMBERS_COLLECTION).doc(user.uid);
  const data = doc.data();
  myMemberId = data.memberId || null;
  renderMemberProfile(data);
  loadProgressHistory();
  buildAndRenderPersonalTree();
});

// render profile fields
function renderMemberProfile(d){
  const nameEl = document.getElementById("profileName") || document.getElementById("memberName");
  const emailEl = document.getElementById("profileEmail") || document.getElementById("memberEmail");
  const idEl = document.getElementById("profileId") || document.getElementById("memberID");
  const phoneEl = document.getElementById("memberPhone");
  const genderEl = document.getElementById("memberGender");
  const locationEl = document.getElementById("memberLocation");
  const photoEl = document.getElementById("profilePhoto") || document.getElementById("avatar") || null;

  if (nameEl) nameEl.textContent = d.fullName || "";
  if (emailEl) emailEl.textContent = d.email || "";
  if (idEl) idEl.textContent = d.memberId || "";
  if (phoneEl) phoneEl.textContent = d.phone || "";
  if (genderEl) genderEl.textContent = d.gender || "";
  if (locationEl) locationEl.textContent = d.location || "";
  if (photoEl && d.photoURL) photoEl.src = d.photoURL;
}

// Photo upload by member
const photoInput = document.getElementById("photoUpload");
if (photoInput) {
  photoInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const uid = firebase.auth().currentUser.uid;
    const ref = storage.ref().child(`member_photos/${uid}/${Date.now()}_${file.name}`);
    try {
      await ref.put(file);
      const url = await ref.getDownloadURL();
      await db.collection(MEMBERS_COLLECTION).doc(uid).update({ photoURL: url });
      // refresh display
      const d = (await db.collection(MEMBERS_COLLECTION).doc(uid).get()).data();
      renderMemberProfile(d);
      alert("Photo uploaded.");
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed: " + err.message);
    }
  });
}

// password reset (sends email)
const resetBtn = document.getElementById("resetPassword");
if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    const user = firebase.auth().currentUser;
    if (!user || !user.email) return alert("No email on account.");
    firebase.auth().sendPasswordResetEmail(user.email).then(() => {
      alert("Password reset email sent to " + user.email);
    }).catch(err => alert("Error: " + err.message));
  });
}

// logout
const logoutBtn = document.getElementById("logout");
if (logoutBtn) logoutBtn.addEventListener("click", () => firebase.auth().signOut().then(()=> window.location.href="signin.html"));

// Update business progress and maintain history
const progressForm = document.getElementById("progressForm");
if (progressForm) {
  progressForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const progressInput = document.getElementById("businessProgress");
    const progress = progressInput.value.trim();
    if (!progress) return;
    try {
      await memberDocRef.update({ businessProgress: progress });
      await memberDocRef.collection("progressHistory").add({
        progress,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      progressInput.value = "";
      alert("Progress updated");
      loadProgressHistory();
    } catch (err) {
      alert("Failed: " + err.message);
    }
  });
}

async function loadProgressHistory(){
  const listEl = document.getElementById("progressHistory");
  if (!memberDocRef || !listEl) return;
  listEl.innerHTML = "";
  const snap = await memberDocRef.collection("progressHistory").orderBy("timestamp","desc").get();
  snap.forEach(doc => {
    const d = doc.data();
    const t = (d.timestamp && d.timestamp.toDate) ? d.timestamp.toDate().toLocaleString() : "-";
    const li = document.createElement("li");
    li.textContent = `${t} — ${d.progress}`;
    listEl.appendChild(li);
  });
}

// Build personal downline tree (member sees nodes under their memberId)
async function fetchChildrenForMember(memberId) {
  const snap = await db.collection(MEMBERS_COLLECTION).where("upline","==",memberId).get();
  const res = [];
  for (const docSnap of snap.docs) {
    const d = docSnap.data();
    res.push({
      docId: docSnap.id,
      memberId: d.memberId,
      name: d.fullName,
      photoURL: d.photoURL || "",
      children: await fetchChildrenForMember(d.memberId)
    });
  }
  return res;
}

function renderPersonalTreeNode(node, container) {
  const li = document.createElement("li");
  const img = node.photoURL || ("https://ui-avatars.com/api/?background=E5E7EB&color=111&name=" + encodeURIComponent(node.name||"LITA"));
  li.innerHTML = `<div style="display:flex;align-items:center;gap:8px">
    <img src="${img}" style="width:30px;height:30px;border-radius:50%;object-fit:cover" />
    <strong>${node.name}</strong> <small style="color:#1d4ed8;margin-left:6px">${node.memberId}</small>
  </div>`;
  if (node.children && node.children.length) {
    const ul = document.createElement("ul");
    node.children.forEach(c => renderPersonalTreeNode(c, ul));
    li.appendChild(ul);
  }
  container.appendChild(li);
}

async function buildAndRenderPersonalTree(){
  const treeRootEl = document.getElementById("treeRoot") || document.getElementById("myTree") || document.getElementById("downlineTree");
  if (!treeRootEl) return;
  treeRootEl.innerHTML = "";
  if (!myMemberId) {
    treeRootEl.innerHTML = "<p>No member ID assigned yet.</p>";
    return;
  }
  const myNode = { memberId: myMemberId, name: "Me", photoURL: "", children: await fetchChildrenForMember(myMemberId) };
  const ul = document.createElement("ul");
  renderPersonalTreeNode(myNode, ul);
  treeRootEl.appendChild(ul);
}

// expose function for HTML
window.buildAndRenderPersonalTree = buildAndRenderPersonalTree;
