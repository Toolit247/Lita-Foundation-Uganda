// js/admin.js
import { auth as primaryAuth, db, storage, firebaseApp } from './firebase.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signOut as authSignOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { collection, doc, setDoc, getDocs, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

// EmailJS init with your public key (you gave this earlier)
emailjs.init("hZgalRaZwSRy1Zgp4");

// Admin email constant
const ADMIN_EMAIL = "toolitambrosehenry@gmail.com";
const MEMBERS_COLL = "members";

// Secondary app so creating a user does not sign out admin
const firebaseConfig = {
  apiKey: "AIzaSyAMnu2djtDKXMrTVKnppeCfKXRCy1KkEYk",
  authDomain: "lita-platform-bffdc.firebaseapp.com",
  projectId: "lita-platform-bffdc",
  storageBucket: "lita-platform-bffdc.appspot.com",
  messagingSenderId: "387943226211",
  appId: "1:387943226211:web:0127c409e0f880df391156"
};

let secondaryApp, secondaryAuth;
try {
  secondaryApp = initializeApp(firebaseConfig, 'secondary');
  secondaryAuth = getAuth(secondaryApp);
} catch (err) {
  // app may already exist
  try {
    secondaryApp = (await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js')).getApp('secondary');
    secondaryAuth = getAuth(secondaryApp);
  } catch(e) {
    // ignore
  }
}

// UI refs
const registerForm = document.getElementById("registerForm");
const registerMessage = document.getElementById("registerMessage");
const membersTableBody = document.querySelector("#membersTable tbody");
const searchBox = document.getElementById("searchBox");
const exportCSVBtn = document.getElementById("exportCSV");
const exportPDFBtn = document.getElementById("exportPDF");
const logoutBtn = document.getElementById("logoutBtn");

// Auth guard: ensure only admin uses this page
primaryAuth.onAuthStateChanged(user => {
  if (!user) return window.location.href = "signin.html";
  if (user.email !== ADMIN_EMAIL) {
    alert("Access denied — admin only.");
    return window.location.href = "signin.html";
  }
  // load members once auth is validated
  loadMembers();
  buildTreeForAdmin();
});

// Register form
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  registerMessage.textContent = "";

  const fullName = document.getElementById("r_fullName").value.trim();
  const email = document.getElementById("r_email").value.trim();
  const phone = document.getElementById("r_phone").value.trim();
  const gender = document.getElementById("r_gender").value;
  const location = document.getElementById("r_location").value.trim();
  const upline = document.getElementById("r_upline").value.trim() || "ROOT";
  const memberId = document.getElementById("r_memberId").value.trim();
  let tempPass = document.getElementById("r_tempPass").value.trim();

  if (!fullName || !email || !memberId) {
    registerMessage.textContent = "❌ Please fill required fields (Name, Email, Member ID).";
    return;
  }
  if (!tempPass) tempPass = Math.random().toString(36).slice(-8);

  registerMessage.textContent = "Registering...";

  try {
    // create firebase auth user using secondary auth
    if (!secondaryAuth) {
      // create secondary app/auth on the fly
      secondaryApp = initializeApp(firebaseConfig, 'secondary');
      secondaryAuth = getAuth(secondaryApp);
    }
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, tempPass);
    const uid = cred.user.uid;

    // save profile to Firestore (doc id = uid)
    await setDoc(doc(db, MEMBERS_COLL, uid), {
      fullName, email, phone, gender, location, upline, memberId,
      photoURL: "", businessProgress: "", createdAt: new Date().toISOString()
    });

    // send credentials via EmailJS (service + template)
    try {
      await emailjs.send("service_mrqs34o", "template_svacje4", {
        to_email: email,
        full_name: fullName,
        member_id: memberId,
        temp_password: tempPass,
        phone: phone || '',
        location: location || '',
        upline: upline || ''
      });
    } catch (e) {
      console.warn("EmailJS send failed:", e);
    }

    // sign out secondary so it doesn't remain signed in
    try { await authSignOut(secondaryAuth); } catch (e){ /* ignore */ }

    registerMessage.textContent = "✅ Member registered. Email sent (if EmailJS OK).";
    registerForm.reset();
    loadMembers();
    buildTreeForAdmin();
  } catch (err) {
    console.error("Register error:", err);
    registerMessage.textContent = "❌ " + err.message;
  }
});

// load members and render
async function loadMembers() {
  membersTableBody.innerHTML = "";
  const snap = await getDocs(query(collection(db, MEMBERS_COLL), orderBy("createdAt","desc")));
  snap.forEach(docSnap => {
    const d = docSnap.data();
    const tr = document.createElement("tr");
    const img = d.photoURL || ("https://ui-avatars.com/api/?background=E5E7EB&color=111&name=" + encodeURIComponent(d.fullName || 'LITA'));
    tr.innerHTML = `
      <td><img src="${img}" class="avatar"></td>
      <td>${d.fullName || ''}</td>
      <td>${d.email || ''}</td>
      <td>${d.memberId || ''}</td>
      <td>${d.upline || ''}</td>
      <td>
        <button data-id="${docSnap.id}" class="btn small delBtn">Delete</button>
        <button data-id="${docSnap.id}" class="btn small viewBtn">View</button>
      </td>
    `;
    membersTableBody.appendChild(tr);
  });

  // attach event listeners
  membersTableBody.querySelectorAll(".delBtn").forEach(b => b.onclick = async (ev) => {
    const id = ev.target.getAttribute("data-id");
    if (!confirm("Delete member (Firestore profile only)?")) return;
    try {
      await deleteDoc(doc(db, MEMBERS_COLL, id));
      alert("Member profile deleted (Auth account remains).");
      loadMembers();
      buildTreeForAdmin();
    } catch (e) { alert("Delete failed: " + e.message); }
  });

  membersTableBody.querySelectorAll(".viewBtn").forEach(b => b.onclick = (ev) => {
    const id = ev.target.getAttribute("data-id");
    window.open("admin_view_member.html?id=" + id, "_blank");
  });
}

// search box filter (client-side)
searchBox?.addEventListener("input", () => {
  const q = (searchBox.value || "").toLowerCase();
  document.querySelectorAll("#membersTable tbody tr").forEach(tr => {
    tr.style.display = tr.innerText.toLowerCase().includes(q) ? "" : "none";
  });
});

// export CSV
exportCSV.addEventListener("click", async () => {
  const snap = await getDocs(collection(db, MEMBERS_COLL));
  let csv = "FullName,Email,MemberID,Upline,Phone,Gender,Location\n";
  snap.forEach(s => {
    const d = s.data();
    csv += `"${(d.fullName||'')}","${(d.email||'')}","${(d.memberId||'')}","${(d.upline||'')}","${(d.phone||'')}","${(d.gender||'')}","${(d.location||'')}"\n`;
  });
  const blob = new Blob([csv], {type: "text/csv"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "members.csv";
  a.click();
});

// export PDF - basic print approach
exportPDF.addEventListener("click", () => {
  const html = document.getElementById("membersTable").outerHTML;
  const w = window.open("", "_blank");
  w.document.write("<html><head><title>Members</title></head><body>" + html + "</body></html>");
  w.print();
});

// logout
logoutBtn.addEventListener("click", () => primaryAuth.signOut().then(()=> window.location.href="signin.html"));

// build tree utility uses tree.js (rendering)
async function buildTreeForAdmin(){
  const snap = await getDocs(collection(db, MEMBERS_COLL));
  const members = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  window.renderTreeInContainer && window.renderTreeInContainer(members, document.getElementById("treeContainer"));
}
