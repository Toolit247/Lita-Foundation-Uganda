import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, sendPasswordResetEmail, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, collection, addDoc, query, orderBy, onSnapshot, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAMnu2djtDKXMrTVKnppeCfKXRCy1KkEYk",
  authDomain: "lita-platform-bffdc.firebaseapp.com",
  projectId: "lita-platform-bffdc",
  storageBucket: "lita-platform-bffdc.appspot.com",
  messagingSenderId: "387943226211",
  appId: "1:387943226211:web:0127c409e0f880df391156"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

let memberDocRef = null;
let myMemberId = "";
let myPhotoURL = "";

onAuthStateChanged(auth, async (user)=>{
  if(!user){ window.location.href="signin.html"; return; }
  const docRef = doc(db, "members", user.uid);
  const docSnap = await getDoc(docRef);
  if(!docSnap.exists()){ await signOut(auth); alert("Access denied"); window.location.href="signin.html"; return; }
  memberDocRef = docRef;
  const d = docSnap.data();
  myMemberId = d.memberId||"";
  myPhotoURL = d.photoURL||"";
  renderProfile(d);
  liveProgressHistory();
  buildAndRenderTree();
});

function renderProfile(d){
  const avatar = document.getElementById("avatar");
  avatar.src = d.photoURL || ("https://ui-avatars.com/api/?background=E5E7EB&color=111&name=" + encodeURIComponent(d.fullName||"LITA"));
  const created = d.createdAt && d.createdAt.toDate ? d.createdAt.toDate().toLocaleString() : "—";
  document.getElementById("profileText").innerHTML = `
    <table>
      <tr><td><strong>Name</strong></td><td>${d.fullName||""}</td></tr>
      <tr><td><strong>Email</strong></td><td>${d.email||""}</td></tr>
      <tr><td><strong>Member ID</strong></td><td><span class="pill">${d.memberId||""}</span></td></tr>
      <tr><td><strong>Upline</strong></td><td>${d.upline||""}</td></tr>
      <tr><td><strong>Phone</strong></td><td>${d.phone||""}</td></tr>
      <tr><td><strong>Gender</strong></td><td>${d.gender||""}</td></tr>
      <tr><td><strong>Location</strong></td><td>${d.location||""}</td></tr>
      <tr><td><strong>Current Progress</strong></td><td>${d.businessProgress||"N/A"}</td></tr>
      <tr><td><strong>Joined</strong></td><td>${created}</td></tr>
    </table>
  `;
}

// Optional photo upload
document.getElementById("uploadPhoto").addEventListener("click", async ()=>{
  const file = document.getElementById("photoFile").files[0];
  const msg = document.getElementById("photoMsg"); msg.textContent=""; msg.className="msg";
  if(!file){ msg.textContent="❌ Select an image."; msg.classList.add("err"); return; }
  const photoRef = ref(storage, `member_photos/${auth.currentUser.uid}/${Date.now()}.jpg`);
  await uploadBytes(photoRef, file);
  const url = await getDownloadURL(photoRef);
  await updateDoc(memberDocRef, { photoURL: url });
  myPhotoURL = url;
  msg.textContent="✅ Photo uploaded"; msg.classList.add("ok");
  renderProfile((await getDoc(memberDocRef)).data());
});

// Update progress
document.getElementById("progressForm").addEventListener("submit", async (e)=>{
  e.preventDefault();
  const progress = document.getElementById("businessProgress").value.trim();
  const msg = document.getElementById("updateMessage"); msg.textContent=""; msg.className="msg";
  await updateDoc(memberDocRef, { businessProgress: progress });
  await addDoc(collection(memberDocRef, "progressHistory"), { progress, timestamp: serverTimestamp() });
  document.getElementById("businessProgress").value="";
  msg.textContent="✅ Progress updated"; msg.classList.add("ok");
  renderProfile((await getDoc(memberDocRef)).data());
});

// Live history
function liveProgressHistory(){
  const q = query(collection(memberDocRef, "progressHistory"), orderBy("timestamp","desc"));
  onSnapshot(q, snap=>{
    const ul = document.getElementById("progressHistory"); ul.innerHTML="";
    snap.forEach(doc=>{
      const d = doc.data();
      const t = d.timestamp && d.timestamp.toDate ? d.timestamp.toDate().toLocaleString() : "—";
      const li = document.createElement("li"); li.textContent = `${t} — ${d.progress}`;
      ul.appendChild(li);
    });
  });
}

// Password reset
document.getElementById("resetPwd").addEventListener("click", async ()=>{
  const user = auth.currentUser;
  if(!user || !user.email){ alert("No email"); return; }
  await sendPasswordResetEmail(auth, user.email);
  alert("Password reset email sent.");
});

// Logout
document.getElementById("logout").addEventListener("click", ()=>signOut(auth).then(()=>window.location.href="signin.html"));

// Recursive downline
async function fetchChildren(uplineId){
  const q = query(collection(db, "members"), where("upline","==",uplineId));
  const snap = await getDocs(q);
  const res = [];
  for(const doc of snap.docs){
    const d = doc.data();
    res.push({ id: doc.id, fullName: d.fullName||"", memberId:d.memberId||"", photoURL:d.photoURL||"", children: await fetchChildren(d.memberId||"") });
  }
  return res;
}
function renderTreeNode(node, ul){
  const li = document.createElement("li");
  const hasChildren = node.children && node.children.length>0;
  const img = node.photoURL || "https://ui-avatars.com/api/?background=E5E7EB&color=111&name="+encodeURIComponent(node.fullName||"LITA");
  const wrapper = document.createElement("div"); wrapper.className="node";
  if(hasChildren){
    const toggle = document.createElement("span"); toggle.textContent="▶"; toggle.className="toggle";
    wrapper.appendChild(toggle);
    let sub;
    toggle.addEventListener("click", ()=>{
      const isHidden = sub.style.display==="none"; sub.style.display = isHidden?"block":"none"; toggle.textContent = isHidden?"▼":"▶";
    });
    sub = document.createElement("ul"); sub.className="tree"; sub.style.display="none";
    node.children.forEach(ch=>renderTreeNode(ch,sub));
    li.appendChild(sub);
  } else { const spacer=document.createElement("span"); spacer.style.width="16px"; wrapper.appendChild(spacer); }
  const avatar = document.createElement("img"); avatar.src=img; wrapper.appendChild(avatar);
  const label = document.createElement("div"); label.innerHTML=`<strong>${node.fullName}</strong> <span class="pill">${node.memberId}</span>`; wrapper.appendChild(label);
  li.appendChild(wrapper); ul.appendChild(li);
}
async function buildAndRenderTree(){
  const target=document.getElementById("treeRoot"); target.innerHTML="";
  if(!myMemberId){ target.innerHTML="<li>No Member ID</li>"; return; }
  const rootNode = { fullName:"Me", memberId:myMemberId, photoURL:myPhotoURL, children: await fetchChildren(myMemberId) };
  const ul = document.createElement("ul"); renderTreeNode(rootNode,ul); target.appendChild(ul);
}
