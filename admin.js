// admin.js — Admin functions: create members (secondary app), list, search, export, delete, tree

// ensure secondary app exists for creating users without signing out admin
var secondary;
try {
  secondary = firebase.app("secondary");
  console.log("Secondary app found");
} catch (e) {
  secondary = firebase.initializeApp(firebaseConfig, "secondary");
  console.log("Secondary app created");
}

// constants
const ADMIN_EMAIL = "toolitambrosehenry@gmail.com";
const MEMBERS_COLLECTION = "members";

// UI elements (make sure IDs match your admin.html)
const addForm = document.getElementById("addMemberForm") || null; // some versions use addMemberForm
const registerForm = document.getElementById("registerForm") || null; // alternate id
const tableBody = document.querySelector("#membersTable tbody");
const searchInput = document.getElementById("searchInput") || document.getElementById("search") || null;
const addMsgEl = document.getElementById("addMemberMessage") || document.getElementById("registerMessage") || null;
const exportCsvBtn = document.getElementById("exportCSV");
const exportPdfBtn = document.getElementById("exportPDF");
const logoutBtn = document.getElementById("logout");

// Guard route — redirect non-admins
firebase.auth().onAuthStateChanged(user => {
  if (!user) {
    // Not logged in
    console.log("Not signed in");
    // If page requires admin, redirect to signin
    // (Your HTML handles that too)
  } else if (user.email !== ADMIN_EMAIL) {
    // Not admin
    console.warn("Access denied: not admin");
    window.location.href = "signin.html";
  } else {
    console.log("Admin signed in:", user.email);
    attachEventHandlers();
    startLiveMembers();
    buildAndRenderTree();
  }
});

// Attach UI handlers if present
function attachEventHandlers(){
  if (addForm) addForm.addEventListener("submit", handleAddMember);
  if (registerForm) registerForm.addEventListener("submit", handleAddMember);
  if (searchInput) searchInput.addEventListener("input", () => startLiveMembers()); // re-filter when typing
  if (exportCsvBtn) exportCsvBtn.addEventListener("click", exportCSV);
  if (exportPdfBtn) exportPdfBtn.addEventListener("click", exportPDF);
  if (logoutBtn) logoutBtn.addEventListener("click", () => firebase.auth().signOut().then(()=> window.location.href="signin.html"));
}

// Create member: uses secondary auth to avoid kicking admin out
async function handleAddMember(e){
  if(e && e.preventDefault) e.preventDefault();

  // Try to obtain fields from multiple possible form structures
  const fullName = (document.getElementById("newFullName") || document.getElementById("fullName") || document.getElementById("fullName") || {}).value || (document.getElementById("memberName") ? document.getElementById("memberName").value : "");
  const email = (document.getElementById("newEmail") || document.getElementById("email") || document.getElementById("memberEmail") || {}).value || "";
  const phone = (document.getElementById("newPhone") || document.getElementById("phone") || {}).value || "";
  const gender = (document.getElementById("newGender") || document.getElementById("gender") || {}).value || "";
  const location = (document.getElementById("newLocation") || document.getElementById("location") || {}).value || "";
  const upline = (document.getElementById("newUpline") || document.getElementById("upline") || {}).value || "ROOT";
  const memberId = (document.getElementById("newMemberId") || document.getElementById("memberId") || {}).value || "";
  const password = (document.getElementById("newPassword") || document.getElementById("tempPassword") || {}).value || "";

  if (!email || !password || !memberId || !fullName) {
    showAddMessage("Please fill required fields (name, email, member ID, password).", true);
    return;
  }

  showAddMessage("Registering member...");

  try {
    // create auth user on secondary app
    const cred = await secondary.auth().createUserWithEmailAndPassword(email, password);
    const uid = cred.user.uid;

    // write profile to primary Firestore
    await db.collection(MEMBERS_COLLECTION).doc(uid).set({
      fullName, email, phone, gender, location, upline, memberId,
      businessProgress: "", photoURL: "", createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // send credentials via EmailJS (include provided fields)
    try {
      await emailjs.send("service_mrqs34o", "template_svacje4", {
        to_email: email,
        full_name: fullName,
        member_id: memberId,
        temp_password: password,
        phone: phone,
        location: location,
        upline: upline
      });
    } catch (emErr) {
      console.warn("EmailJS send failed:", emErr);
    }

    // Sign out secondary so it doesn't hold auth state
    try { await secondary.auth().signOut(); } catch(_) {}

    showAddMessage("✅ Member registered — email sent (if EmailJS OK).", false, true);
    // reset possible forms
    (document.getElementById("addMemberForm") || document.getElementById("registerForm") || {}).reset && (document.getElementById("addMemberForm") || document.getElementById("registerForm")).reset();

    // reload list + tree
    startLiveMembers();
    buildAndRenderTree();
  } catch (err) {
    console.error("Register member error:", err);
    showAddMessage("❌ " + err.message, true);
  }
}

function showAddMessage(msg, isError=false, isOk=false){
  const el = addMsgEl || document.getElementById("registerMessage") || document.getElementById("addMemberMessage");
  if(!el) { console.log(msg); return; }
  el.textContent = msg;
  el.className = "msg " + (isError? "err": (isOk? "ok": ""));
}

// Live members (realtime) with simple search filter
let membersUnsub = null;
function startLiveMembers(){
  if (membersUnsub) membersUnsub(); // unsubscribe previous
  const q = db.collection(MEMBERS_COLLECTION).orderBy("createdAt","desc");
  membersUnsub = q.onSnapshot(snapshot => {
    const docs = snapshot.docs;
    renderMembersTable(docs);
  }, err => console.error("members snapshot err",err));
}

function renderMembersTable(docs){
  if (!tableBody) return;
  tableBody.innerHTML = "";
  const filter = (searchInput && searchInput.value)? searchInput.value.toLowerCase() : (document.getElementById("search") && document.getElementById("search").value ? document.getElementById("search").value.toLowerCase() : "");
  docs.forEach(doc => {
    const d = doc.data();
    const hay = [d.fullName,d.email,d.phone,d.gender,d.location,d.upline,d.memberId].join(" ").toLowerCase();
    if (filter && !hay.includes(filter)) return;
    const img = d.photoURL || ("https://ui-avatars.com/api/?background=E5E7EB&color=111&name=" + encodeURIComponent(d.fullName||"LITA"));
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><img src="${img}" style="width:40px;height:40px;border-radius:50%;object-fit:cover"></td>
      <td>${d.fullName||''}</td>
      <td>${d.email||''}</td>
      <td>${d.phone||''}</td>
      <td>${d.gender||''}</td>
      <td>${d.location||''}</td>
      <td>${d.memberId||''}</td>
      <td>${d.upline||''}</td>
      <td>${d.businessProgress? escapeHtml(d.businessProgress).slice(0,40) : 'N/A'}</td>
      <td>
        <button class="viewBtn" data-id="${doc.id}">View</button>
        <button class="editBtn" data-id="${doc.id}">Edit ID</button>
        <button class="delBtn" data-id="${doc.id}">Delete</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  // attach delegated events
  tableBody.querySelectorAll(".delBtn").forEach(b => b.onclick = (ev) => {
    const id = ev.target.getAttribute("data-id");
    if (!confirm("Delete member profile? (this removes Firestore profile only)")) return;
    db.collection(MEMBERS_COLLECTION).doc(id).delete().then(()=> {
      alert("Member profile deleted.");
      buildAndRenderTree();
    }).catch(err => alert("Failed: "+err.message));
  });

  tableBody.querySelectorAll(".editBtn").forEach(b => b.onclick = async (ev) => {
    const id = ev.target.getAttribute("data-id");
    const newId = prompt("Enter new Member ID:");
    if (!newId) return;
    db.collection(MEMBERS_COLLECTION).doc(id).update({ memberId: newId }).then(()=> {
      alert("Member ID updated");
      buildAndRenderTree();
    }).catch(err => alert("Failed: "+err.message));
  });

  tableBody.querySelectorAll(".viewBtn").forEach(b => b.onclick = (ev) => {
    const id = ev.target.getAttribute("data-id");
    viewProgressHistory(id);
  });
}

// small helper
function escapeHtml(s){ return (s||"").toString().replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

// view progress history in popup window
function viewProgressHistory(memberDocId) {
  const w = window.open("", "Progress History", "width=700,height=520");
  w.document.write("<h3>Progress History</h3><ul id='h'></ul>");
  db.collection(MEMBERS_COLLECTION).doc(memberDocId).collection("progressHistory").orderBy("timestamp","desc").get()
    .then(snap=>{
      const list = w.document.getElementById("h");
      snap.forEach(doc => {
        const d = doc.data();
        const t = d.timestamp && d.timestamp.toDate ? d.timestamp.toDate().toLocaleString() : "-";
        const li = w.document.createElement("li");
        li.textContent = `${t} — ${d.progress}`;
        list.appendChild(li);
      });
    });
}

// CSV export
async function exportCSV(){
  const qs = await db.collection(MEMBERS_COLLECTION).get();
  let csv = "Full Name,Email,MemberID,Phone,Gender,Location,Upline,BusinessProgress\n";
  qs.forEach(doc=>{
    const d = doc.data();
    const row = [
      d.fullName||"", d.email||"", d.memberId||"", d.phone||"", d.gender||"", d.location||"", d.upline||"", (d.businessProgress||"").replace(/[\n\r]+/g," ")
    ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(",");
    csv += row + "\n";
  });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "members.csv"; document.body.appendChild(a); a.click(); a.remove();
}

// PDF export (simple, text-lines)
async function exportPDF(){
  if (!window.jspdf) {
    alert("PDF export requires jsPDF. Add jspdf script to admin.html");
    return;
  }
  const { jsPDF } = window.jspdf;
  const docPdf = new jsPDF();
  let y = 10;
  docPdf.setFontSize(12);
  docPdf.text("LITA Members", 10, y); y += 8;
  const qs = await db.collection(MEMBERS_COLLECTION).get();
  qs.forEach(doc => {
    const d = doc.data();
    const line = `${d.fullName} — ${d.email} — ${d.memberId}`;
    docPdf.text(line, 10, y);
    y += 6;
    if (y > 280) { docPdf.addPage(); y = 10; }
  });
  docPdf.save("members.pdf");
}

// ---------- Tree building ----------
async function fetchChildrenByMemberId(memberId) {
  const snap = await db.collection(MEMBERS_COLLECTION).where("upline","==",memberId).get();
  const arr = [];
  for (const d of snap.docs){
    const dd = d.data();
    arr.push({
      docId: d.id,
      memberId: dd.memberId,
      name: dd.fullName,
      photoURL: dd.photoURL || "",
      children: await fetchChildrenByMemberId(dd.memberId || "")
    });
  }
  return arr;
}

function renderTreeNode(node, container){
  const li = document.createElement("li");
  li.innerHTML = `<div style="display:flex;gap:8px;align-items:center">
    <img src="${node.photoURL || 'https://ui-avatars.com/api/?background=E5E7EB&color=111&name=' + encodeURIComponent(node.name||'LITA')}" style="width:30px;height:30px;border-radius:50%;object-fit:cover"/>
    <span style="font-weight:600">${node.name}</span> <small style="color:#1d4ed8;margin-left:6px">${node.memberId}</small>
  </div>`;
  if (node.children && node.children.length){
    const ul = document.createElement("ul");
    node.children.forEach(child => renderTreeNode(child, ul));
    li.appendChild(ul);
  }
  container.appendChild(li);
}

async function buildAndRenderTree(){
  const rootEl = document.getElementById("treeRoot") || document.getElementById("membersTree") || document.getElementById("memberTree") || document.getElementById("memberTreeDiv") || null;
  if(!rootEl) return;
  rootEl.innerHTML = "";
  // fetch top-level members (upline ROOT or null)
  const topSnap = await db.collection(MEMBERS_COLLECTION).where("upline","==","ROOT").get()
    .catch(async ()=> {
      // fallback: consider upline field empty
      return await db.collection(MEMBERS_COLLECTION).where("upline","==","").get();
    });
  const rootNode = { memberId: "ROOT", name: "LITA Network", photoURL: "", children: [] };
  for (const doc of topSnap.docs) {
    const d = doc.data();
    const subtree = {
      memberId: d.memberId,
      name: d.fullName,
      photoURL: d.photoURL || "",
      children: await fetchChildrenByMemberId(d.memberId)
    };
    rootNode.children.push(subtree);
  }
  const ul = document.createElement("ul");
  renderTreeNode(rootNode, ul);
  rootEl.appendChild(ul);
}

// expose some functions globally if needed
window.buildAndRenderTree = buildAndRenderTree;
window.exportCSV = exportCSV;
window.exportPDF = exportPDF;
