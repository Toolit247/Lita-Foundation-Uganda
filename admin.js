import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, setDoc, doc, getDocs, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
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

// Admin email restriction
const ADMIN_EMAIL = "toolitambrosehenry@gmail.com";

onAuthStateChanged(auth, async (user)=>{
  if(!user || user.email !== ADMIN_EMAIL){
    alert("Access denied. Admin only.");
    signOut(auth);
    window.location.href="signin.html";
    return;
  }
  loadMembers();
});

// Logout
document.getElementById("logout").addEventListener("click", ()=>signOut(auth).then(()=>window.location.href="signin.html"));

// ---- Registration ----
document.getElementById("adminRegistrationForm").addEventListener("submit", async (e)=>{
  e.preventDefault();
  const msg = document.getElementById("registrationMessage"); msg.textContent=""; msg.className="msg";

  const fullName = document.getElementById("fullName").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const phone = document.getElementById("phone").value.trim();
  const memberId = document.getElementById("memberId").value.trim();
  const upline = document.getElementById("upline").value.trim();
  const gender = document.getElementById("gender").value.trim();
  const location = document.getElementById("location").value.trim();
  const photoFile = document.getElementById("photoFile").files[0];

  try{
    // Create UID-based document
    const docRef = doc(db, "members", email.replace(/[@.]/g,"_"));
    let photoURL = "";
    if(photoFile){
      const photoRef = ref(storage, `member_photos/${docRef.id}/${Date.now()}.jpg`);
      await uploadBytes(photoRef, photoFile);
      photoURL = await getDownloadURL(photoRef);
    }

    await setDoc(docRef, {
      fullName,
      email,
      phone,
      memberId,
      upline,
      gender,
      location,
      photoURL,
      createdAt: serverTimestamp(),
      businessProgress: ""
    });

    msg.textContent = "✅ Member registered successfully!"; msg.style.color="green";
    e.target.reset();
    loadMembers();
  } catch(err){
    msg.textContent = "❌ " + err.message; msg.style.color="red";
  }
});

// ---- Load Members ----
async function loadMembers(){
  const tbody = document.querySelector("#membersTable tbody");
  tbody.innerHTML="";
  const q = query(collection(db,"members"), orderBy("fullName"));
  const snap = await getDocs(q);
  snap.forEach(doc=>{
    const d = doc.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.fullName||""}</td>
      <td>${d.email||""}</td>
      <td>${d.memberId||""}</td>
      <td>${d.upline||""}</td>
      <td>${d.phone||""}</td>
      <td>${d.gender||""}</td>
      <td>${d.location||""}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ---- Search Members ----
document.getElementById("searchInput").addEventListener("input", function(){
  const filter = this.value.toLowerCase();
  const rows = document.querySelectorAll("#membersTable tbody tr");
  rows.forEach(row=>{
    row.style.display = row.textContent.toLowerCase().includes(filter) ? "" : "none";
  });
});

// ---- Export CSV ----
document.getElementById("exportCSV").addEventListener("click", ()=>{
  const rows = document.querySelectorAll("#membersTable tr");
  let csvContent = "";
  rows.forEach((row,i)=>{
    const cols = row.querySelectorAll("th, td");
    const rowData = Array.from(cols).map(c=>`"${c.textContent}"`).join(",");
    csvContent += rowData + "\n";
  });
  const blob = new Blob([csvContent], {type: "text/csv;charset=utf-8;"});
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "members.csv";
  link.click();
});
