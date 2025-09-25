const auth = firebase.auth();
const db = firebase.firestore();

// Logout
function logout() {
  auth.signOut().then(() => window.location.href = "signin.html");
}

// Register new member
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const uplineId = document.getElementById("uplineId").value || null;
  const manualId = document.getElementById("manualId").value;
  const tempPassword = Math.random().toString(36).slice(-8);

  try {
    const userCred = await auth.createUserWithEmailAndPassword(email, tempPassword);
    const uid = userCred.user.uid;

    await db.collection("members").doc(uid).set({
      name, email, uplineId, memberId: manualId, photoURL: "", createdAt: new Date()
    });

    // EmailJS send
    emailjs.send("service_mrqs34o", "template_svacje4", {
      to_email: email,
      to_name: name,
      member_id: manualId,
      temp_password: tempPassword
    });

    document.getElementById("registerMessage").textContent = "✅ Member registered and email sent!";
    loadMembers();
  } catch (err) {
    document.getElementById("registerMessage").textContent = "❌ " + err.message;
  }
});

// Load all members
async function loadMembers() {
  const tbody = document.querySelector("#membersTable tbody");
  tbody.innerHTML = "";
  const snapshot = await db.collection("members").get();
  snapshot.forEach(doc => {
    const m = doc.data();
    const row = `
      <tr>
        <td>${m.photoURL ? `<img src="${m.photoURL}" class="avatar">` : "❌"}</td>
        <td>${m.name}</td>
        <td>${m.email}</td>
        <td>${m.memberId}</td>
        <td>${m.uplineId || "-"}</td>
        <td><button onclick="deleteMember('${doc.id}')">🗑 Delete</button></td>
      </tr>`;
    tbody.innerHTML += row;
  });
  renderTree(snapshot.docs.map(d => d.data())); // call tree.js
}
loadMembers();

// Delete member
async function deleteMember(uid) {
  if (!confirm("Are you sure to delete this member?")) return;
  await db.collection("members").doc(uid).delete();
  alert("Member deleted.");
  loadMembers();
}

// Export CSV
function exportCSV() {
  let csv = "Name,Email,Member ID,Upline ID\n";
  document.querySelectorAll("#membersTable tbody tr").forEach(row => {
    const cols = row.querySelectorAll("td");
    csv += `${cols[1].innerText},${cols[2].innerText},${cols[3].innerText},${cols[4].innerText}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "members.csv";
  link.click();
}

// Export PDF
function exportPDF() {
  const content = document.getElementById("membersTable").outerHTML;
  const win = window.open("");
  win.document.write("<html><body>" + content + "</body></html>");
  win.print();
}

// Search
document.getElementById("searchBox").addEventListener("input", (e) => {
  const val = e.target.value.toLowerCase();
  document.querySelectorAll("#membersTable tbody tr").forEach(row => {
    row.style.display = row.innerText.toLowerCase().includes(val) ? "" : "none";
  });
});
